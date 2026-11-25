#!/bin/sh
BROWSER="false"
CALLBACK_HOST="0.0.0.0"
CALLBACK_PORT="8976"

pnpx wrangler login \
    --browser="$BROWSER" \
    --callback-host="$CALLBACK_HOST" \
    --callback-port="$CALLBACK_PORT" | stdbuf -oL sed "s/$CALLBACK_HOST/localhost/g"
