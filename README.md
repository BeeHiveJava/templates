# templates

Interactive:

```sh
curl -fsSL https://raw.githubusercontent.com/beehivejava/templates/main/init.sh | bash
```

Non-interactive:

```sh
curl -fsSL https://raw.githubusercontent.com/beehivejava/templates/main/init.sh | bash -s -- node
```

Local test:

```sh
mkdir -p /tmp/test && cd /tmp/test && TEMPLATE=/workspaces/templates bash /workspaces/templates/init.sh node
```
