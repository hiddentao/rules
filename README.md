# Rules

[![CI](https://github.com/hiddentao/rules/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/hiddentao/rules/actions/workflows/ci.yml)

A command-line tool for installing Cursor/Windsurf rules from Github repositories.

## Features

- Install rules for Cursor/Windsurf from any GitHub repository
- Support for multiple rule formats (`.cursor/rules`, `.cursorrules`, `.windsurfrules`)
- Format conversion between different rule types
- Interactive selection of rule types when multiple are available
- Native binaries available for Linux, OS X, and Windows

## Installation

### From npm

```bash
npm install -g rules
```

### Using native binaries

Download the appropriate binary for your platform from the [Releases](https://github.com/hiddentao/rules/releases) page.

#### Linux

```bash
curl -fsSL https://github.com/hiddentao/rules/releases/latest/download/rules-linux -o rules
chmod +x rules
sudo mv rules /usr/local/bin/
```

#### macOS

```bash
curl -fsSL https://github.com/hiddentao/rules/releases/latest/download/rules-macos -o rules
chmod +x rules
sudo mv rules /usr/local/bin/
```

#### Windows

Download `rules-win.exe` from the Releases page and add it to your PATH.

### From source

```bash
git clone https://github.com/hiddentao/rules.git
cd rules
bun install
bun run build
# Link for development
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

# Install rules with verbose logging
rules install <repository> --verbose
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

# Generate native binaries
bun run build:native
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using conventional commits (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE.md)
