# rules

```ascii
                      ████                  
                     ░░███                  
 ████████  █████ ████ ░███   ██████   █████ 
░░███░░███░░███ ░███  ░███  ███░░███ ███░░  
 ░███ ░░░  ░███ ░███  ░███ ░███████ ░░█████ 
 ░███      ░███ ░███  ░███ ░███░░░   ░░░░███
 █████     ░░████████ █████░░██████  ██████ 
░░░░░       ░░░░░░░░ ░░░░░  ░░░░░░  ░░░░░░  
```

[![CI](https://github.com/hiddentao/rules/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/hiddentao/rules/actions/workflows/ci.yml)

A command-line tool for installing Cursor/Windsurf rules from Github repositories into your local folder.

## Features

- Install rules for Cursor/Windsurf from any GitHub repository.
- Support for multiple rule formats (`.cursor/rules`, `.cursorrules`, `.windsurfrules`).
- Automatic conversion between different rule types.
- Interactive selection of rule types when multiple are found in the repo.
- Robust test suite with with [end-to-end testing](https://github.com/hiddentao/rules/blob/main/test/e2e.test.ts).
- Native binaries available for Linux, OS X, and Windows.

## Installation

Use your favourite Node.js package manager to install it:

```shell
# Install with Bun - RECOMMENDED!
bun add --global @hiddentao/rules

# Install with NPM
npm install --global @hiddentao/rules

# Install with PNPM
pnpm install --global @hiddentao/rules

# Install with Yarn
yarn add --global @hiddentao/rules
```

You can install the native binaries (Windows, OS X, Linus) for the latest release:

```shell
# Windows
curl -f https://github.com/hiddentao/rules/releases/latest/download/rules-win.exe -o rules.exe

# Mac/OS X
curl -f https://github.com/hiddentao/rules/releases/latest/download/rules-macos -o rules

# Linux
curl -f https://github.com/hiddentao/rules/releases/latest/download/rules-linux -o rules
```

Remember to add the native binary to your `PATH` to be able to call it from anywhere.

## Usage

```bash
# Show help
rules --help

# Install rules from a GitHub repository into current folder
rules install <github_user_or_org/repository_name>

# Install rules in Cursor format (.cursor/rules)
rules install <github_user_or_org/repository_name> --format cursor 

# Install rules in Windsurf format (.windsurfrules)
rules install <github_user_or_org/repository_name> --format windsurf 

# Install rules from a GitHub repository subfolder path
rules install <github_user_or_org/repository_name/path/to/subfolder_containing_rules>

# Install rules with verbose logging
rules install <github_user_or_org/repository_name> --verbose
```

When a rules format (`--cursor` or `--windsurf`) is specified, the tool will check the repo to see if a matching rule type is available. If not, it will convert whatever is available into your specified type.

If more than one rule type is available in the repo and you haven't specified an output format then the tool will ask you to choose one.

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build
bun run build

# Run tests (note: you need to run the build first for end-to-end tests to work)
bun test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Copyright (c) 2025 [Ramesh Nair](https://github.com/hiddentao)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 
