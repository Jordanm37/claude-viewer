import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			// Premium Design System Colors
  			premium: {
  				base: 'var(--color-base)',
  				bg: {
  					primary: 'var(--color-bg-primary)',
  					secondary: 'var(--color-bg-secondary)',
  					tertiary: 'var(--color-bg-tertiary)'
  				},
  				text: {
  					primary: 'var(--color-text-primary)',
  					secondary: 'var(--color-text-secondary)',
  					tertiary: 'var(--color-text-tertiary)'
  				},
  				accent: {
  					blue: 'var(--color-accent-blue)',
  					green: 'var(--color-accent-green)',
  					amber: 'var(--color-accent-amber)',
  					red: 'var(--color-accent-red)',
  					purple: 'var(--color-accent-purple)'
  				}
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		spacing: {
  			// 8-point grid spacing
  			'space-1': 'var(--space-1)',
  			'space-2': 'var(--space-2)',
  			'space-3': 'var(--space-3)',
  			'space-4': 'var(--space-4)',
  			'space-5': 'var(--space-5)',
  			'space-6': 'var(--space-6)',
  			'space-8': 'var(--space-8)'
  		},
  		fontFamily: {
  			'display': ['var(--font-display)'],
  			'text': ['var(--font-text)'],
  			'mono': ['var(--font-mono)']
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'premium': '12px',
  			'message': '20px'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'shimmer': {
  				'0%': { backgroundPosition: '-1000px 0' },
  				'100%': { backgroundPosition: '1000px 0' }
  			},
  			'fade-in': {
  				'0%': { opacity: '0', transform: 'translateY(4px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'shimmer': 'shimmer 2s infinite',
  			'fade-in': 'fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  			'delay-75': 'shimmer 2s infinite 75ms',
  			'delay-150': 'shimmer 2s infinite 150ms'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
}
export default config