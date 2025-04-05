# Rules CLI

A command-line tool for managing Cursor rules.

## Features

- Install rules from GitHub repositories
- Support for multiple rule formats (`.cursor/rules`, `.cursorrules`, `.windsurfrules`)
- Format conversion between different rule types
- Interactive selection of rule types when multiple are available

## Installation

### From npm

```bash
npm install -g @cursor/rules
```

### From source

```bash
git clone https://github.com/user/rules.git
cd rules
bun install
bun link
```

## Usage

```bash
# Show help
rules --help

# Install rules from a GitHub repository
rules install <repository>

# Install rules with a specific output format
rules install <repository> --format cursor
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Build for production
bun run build
```

## License

MIT
