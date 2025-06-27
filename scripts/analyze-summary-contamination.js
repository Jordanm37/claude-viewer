#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { homedir } = require('os');

// Get project directory from command line or use current directory
const projectDir = process.argv[2] || process.cwd();
const projectName = projectDir.replace(/[^a-zA-Z0-9]/g, '-');
const sessionsDir = path.join(homedir(), '.claude', 'projects', projectName);

console.log(`Analyzing sessions in: ${sessionsDir}\n`);

function getMessagePreview(msg, maxLength = 50) {
  if (!msg || !msg.message) return 'No content';
  
  let content = msg.message.content;
  if (typeof content === 'string') {
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
  } else if (Array.isArray(content)) {
    // Handle array of content blocks
    const textBlock = content.find(block => block.type === 'text');
    if (textBlock && textBlock.text) {
      return textBlock.text.substring(0, maxLength) + (textBlock.text.length > maxLength ? '...' : '');
    }
  }
  return 'Complex content';
}

async function parseJSONL(filePath) {
  const messages = [];
  const summaries = [];
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'summary') {
        summaries.push(obj);
      } else if (obj.type === 'user' || obj.type === 'assistant') {
        messages.push(obj);
      }
    } catch (e) {
      console.error(`Error parsing line in ${path.basename(filePath)}: ${e.message}`);
    }
  }

  return { messages, summaries };
}

async function analyzeAllSessions() {
  if (!fs.existsSync(sessionsDir)) {
    console.error(`Sessions directory not found: ${sessionsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => path.join(sessionsDir, f));

  console.log(`Found ${files.length} session files\n`);

  // First pass: collect all messages and summaries
  const sessions = new Map();
  const allMessageUuids = new Map(); // uuid -> { sessionId, message }
  const orphanedSummaries = [];

  for (const file of files) {
    const sessionId = path.basename(file, '.jsonl');
    const { messages, summaries } = await parseJSONL(file);
    
    sessions.set(sessionId, { file, messages, summaries });
    
    // Index all message UUIDs
    for (const msg of messages) {
      if (msg.uuid) {
        allMessageUuids.set(msg.uuid, { sessionId, message: msg });
      }
    }
  }

  // Second pass: find misplaced summaries
  const misplacedSummaries = new Map(); // currentSessionId -> [{ summary, belongsTo }]

  for (const [sessionId, { summaries, messages }] of sessions) {
    const messageUuids = new Set(messages.map(m => m.uuid));
    
    for (const summary of summaries) {
      if (!summary.leafUuid) continue;
      
      // Check if this summary's leafUuid exists in current session
      if (!messageUuids.has(summary.leafUuid)) {
        // Find where this UUID actually lives
        const owner = allMessageUuids.get(summary.leafUuid);
        
        if (!misplacedSummaries.has(sessionId)) {
          misplacedSummaries.set(sessionId, []);
        }
        
        misplacedSummaries.get(sessionId).push({
          summary,
          belongsTo: owner ? owner.sessionId : null,
          message: owner ? owner.message : null
        });
      }
    }
  }

  // Report findings
  console.log('=== MISPLACED SUMMARIES ANALYSIS ===\n');
  
  let totalMisplaced = 0;
  for (const [sessionId, misplaced] of misplacedSummaries) {
    if (misplaced.length === 0) continue;
    
    totalMisplaced += misplaced.length;
    const sessionData = sessions.get(sessionId);
    const firstUserMsg = sessionData.messages.find(m => m.type === 'user');
    const sessionPreview = firstUserMsg ? 
      getMessagePreview(firstUserMsg) : 
      'No user messages';
    
    console.log(`\nSession: ${sessionId}`);
    console.log(`Preview: "${sessionPreview}"`);
    console.log(`Contains ${misplaced.length} misplaced summaries:`);
    
    for (const { summary, belongsTo, message } of misplaced) {
      console.log(`\n  - Summary: "${summary.summary}"`);
      console.log(`    leafUuid: ${summary.leafUuid}`);
      
      if (belongsTo) {
        const ownerSession = sessions.get(belongsTo);
        const ownerFirstMsg = ownerSession.messages.find(m => m.type === 'user');
        const ownerPreview = ownerFirstMsg ? 
          getMessagePreview(ownerFirstMsg, 40) : 
          'No user messages';
        
        console.log(`    → Belongs to session: ${belongsTo}`);
        console.log(`      Session preview: "${ownerPreview}"`);
        if (message && message.timestamp) {
          console.log(`      Message timestamp: ${message.timestamp}`);
        }
      } else {
        console.log(`    → Owner session NOT FOUND (UUID doesn't exist in any session)`);
      }
    }
  }

  // Find sessions missing summaries
  console.log('\n\n=== SESSIONS POTENTIALLY MISSING SUMMARIES ===\n');
  
  for (const [sessionId, { messages, summaries }] of sessions) {
    // Check if this session has leaf messages without summaries
    const leafMessages = findLeafMessages(messages);
    const summaryUuids = new Set(summaries.map(s => s.leafUuid));
    const missingSummaries = leafMessages.filter(m => !summaryUuids.has(m.uuid));
    
    if (missingSummaries.length > 0) {
      const firstUserMsg = messages.find(m => m.type === 'user');
      const sessionPreview = firstUserMsg ? 
        getMessagePreview(firstUserMsg) : 
        'No user messages';
      
      console.log(`\nSession: ${sessionId}`);
      console.log(`Preview: "${sessionPreview}"`);
      console.log(`Missing summaries for ${missingSummaries.length} conversation chains`);
    }
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Total misplaced summaries found: ${totalMisplaced}`);
  console.log(`Affected session files: ${misplacedSummaries.size}`);
  
  // Create proposed fixes
  if (totalMisplaced > 0) {
    console.log(`\n=== PROPOSED FIXES ===\n`);
    
    const fixes = new Map(); // sessionId -> { add: [], remove: [] }
    
    for (const [sessionId, misplaced] of misplacedSummaries) {
      for (const { summary, belongsTo } of misplaced) {
        // Remove from current location
        if (!fixes.has(sessionId)) {
          fixes.set(sessionId, { add: [], remove: [] });
        }
        fixes.get(sessionId).remove.push(summary);
        
        // Add to correct location
        if (belongsTo) {
          if (!fixes.has(belongsTo)) {
            fixes.set(belongsTo, { add: [], remove: [] });
          }
          fixes.get(belongsTo).add.push(summary);
        }
      }
    }
    
    for (const [sessionId, { add, remove }] of fixes) {
      console.log(`\nSession ${sessionId}:`);
      if (remove.length > 0) {
        console.log(`  Remove ${remove.length} summaries`);
      }
      if (add.length > 0) {
        console.log(`  Add ${add.length} summaries`);
      }
    }
    
    console.log(`\nTo apply these fixes, run with --fix flag (not implemented yet)`);
  }
}

function findLeafMessages(messages) {
  const parentUuids = new Set(messages.map(m => m.parentUuid).filter(Boolean));
  return messages.filter(m => m.uuid && !parentUuids.has(m.uuid));
}

// Run analysis
analyzeAllSessions().catch(console.error);