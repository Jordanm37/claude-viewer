#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

async function parseJSONL(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line);
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.error(`${colors.red}Error parsing line in ${filepath}:${colors.reset}`, e.message);
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`${colors.red}Error reading ${filepath}:${colors.reset}`, error.message);
    }
    return [];
  }
}

async function getAllSessionFiles() {
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');
  const dirs = await fs.readdir(projectsDir);
  const sessionFiles = [];

  for (const dir of dirs) {
    const dirPath = path.join(projectsDir, dir);
    const stats = await fs.stat(dirPath);
    
    if (stats.isDirectory()) {
      const files = await fs.readdir(dirPath);
      const jsonlFiles = files
        .filter(f => f.endsWith('.jsonl'))
        .map(f => path.join(dirPath, f));
      sessionFiles.push(...jsonlFiles);
    }
  }

  return sessionFiles;
}

async function fixMisplacedSummaries(dryRun = false) {
  console.log(`${colors.cyan}🔍 Scanning for misplaced summaries...${colors.reset}\n`);
  
  // Step 1: Build a map of all messages across all sessions
  const messageToSession = new Map(); // uuid -> sessionFile
  const sessionFiles = await getAllSessionFiles();
  let totalMessages = 0;
  let totalSummaries = 0;
  
  console.log(`Found ${sessionFiles.length} session files\n`);
  
  // First pass: map all message UUIDs to their session files
  for (const file of sessionFiles) {
    const entries = await parseJSONL(file);
    const messages = entries.filter(e => 
      ['user', 'assistant', 'system', 'attachment'].includes(e.type)
    );
    
    for (const msg of messages) {
      if (msg.uuid) {
        messageToSession.set(msg.uuid, file);
        totalMessages++;
      }
    }
  }
  
  console.log(`${colors.dim}Mapped ${totalMessages} messages across all sessions${colors.reset}\n`);
  
  // Step 2: Find all misplaced summaries and where they belong
  const fixes = []; // { fromFile, toFile, summary }
  const filesToRewrite = new Map(); // file -> entries (without misplaced summaries)
  const summariesToAdd = new Map(); // file -> summaries to add
  
  for (const file of sessionFiles) {
    const entries = await parseJSONL(file);
    const validEntries = [];
    const summaries = entries.filter(e => e.type === 'summary');
    totalSummaries += summaries.length;
    
    for (const entry of entries) {
      if (entry.type === 'summary' && entry.leafUuid) {
        const correctFile = messageToSession.get(entry.leafUuid);
        
        if (correctFile && correctFile !== file) {
          // This summary is misplaced
          fixes.push({
            fromFile: file,
            toFile: correctFile,
            summary: entry
          });
          
          // Add to the list of summaries to add to the correct file
          if (!summariesToAdd.has(correctFile)) {
            summariesToAdd.set(correctFile, []);
          }
          summariesToAdd.get(correctFile).push(entry);
        } else {
          // Keep this entry
          validEntries.push(entry);
        }
      } else {
        // Keep all non-summary entries and summaries that belong here
        validEntries.push(entry);
      }
    }
    
    // Only mark for rewrite if we removed something
    if (validEntries.length < entries.length) {
      filesToRewrite.set(file, validEntries);
    }
  }
  
  console.log(`${colors.yellow}📊 Summary:${colors.reset}`);
  console.log(`   Total summaries found: ${totalSummaries}`);
  console.log(`   Misplaced summaries: ${fixes.length}`);
  console.log(`   Files to fix: ${filesToRewrite.size + summariesToAdd.size}\n`);
  
  if (fixes.length === 0) {
    console.log(`${colors.green}✅ No misplaced summaries found!${colors.reset}`);
    return;
  }
  
  // Step 3: Show what will be fixed
  console.log(`${colors.yellow}📝 Fixes to apply:${colors.reset}\n`);
  
  const fixesByFile = {};
  for (const fix of fixes) {
    const fromName = path.basename(fix.fromFile);
    const toName = path.basename(fix.toFile);
    const key = `${fromName} → ${toName}`;
    
    if (!fixesByFile[key]) {
      fixesByFile[key] = [];
    }
    fixesByFile[key].push(fix.summary.summary);
  }
  
  for (const [key, summaries] of Object.entries(fixesByFile)) {
    console.log(`  ${key}:`);
    for (const summary of summaries) {
      console.log(`    - "${summary.substring(0, 60)}${summary.length > 60 ? '...' : ''}"`);
    }
    console.log();
  }
  
  if (dryRun) {
    console.log(`${colors.cyan}🔍 DRY RUN - No changes made${colors.reset}`);
    return;
  }
  
  // Step 4: Apply fixes
  console.log(`${colors.green}✍️  Applying fixes...${colors.reset}\n`);
  
  // Rewrite files that had summaries removed
  for (const [file, entries] of filesToRewrite) {
    const content = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
    await fs.writeFile(file, content, 'utf8');
    console.log(`  ✓ Removed misplaced summaries from ${path.basename(file)}`);
  }
  
  // Add summaries to their correct files
  for (const [file, summaries] of summariesToAdd) {
    // If this file wasn't already rewritten, we need to read it
    let entries;
    if (filesToRewrite.has(file)) {
      entries = filesToRewrite.get(file);
    } else {
      entries = await parseJSONL(file);
    }
    
    // Separate summaries and non-summaries
    const existingSummaries = entries.filter(e => e.type === 'summary');
    const nonSummaries = entries.filter(e => e.type !== 'summary');
    
    // Combine all summaries (existing + new) and put them at the top
    const allSummaries = [...existingSummaries, ...summaries];
    const finalEntries = [...allSummaries, ...nonSummaries];
    
    // Write the file with summaries at the top
    const content = finalEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
    await fs.writeFile(file, content, 'utf8');
    console.log(`  ✓ Added ${summaries.length} summaries to ${path.basename(file)}`);
  }
  
  console.log(`\n${colors.green}✅ Successfully fixed ${fixes.length} misplaced summaries!${colors.reset}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  if (dryRun) {
    console.log(`${colors.cyan}Running in DRY RUN mode - no changes will be made${colors.reset}\n`);
  }
  
  try {
    await fixMisplacedSummaries(dryRun);
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixMisplacedSummaries };