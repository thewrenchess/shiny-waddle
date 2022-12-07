# Shiny Waddle
because I don't want randos to know what it is

## Install
`npm install`

## Usage
This file takes four args:
1. `boToken`: backoffice token, required, no need to add `backoffice-` in front
2. `filePath`: relative file path to csv file, required
3. `sourceIdName`: column name of `sourceLocationIsd`, default `sourceLocationId`
4. `orderIdName`: column name of `orderId`, default `orderId`


`node index.js <boToken> <filepath> <sourceIdName> <orderIdName>`
it takes a csv fiile, parse for `sourceLocationId` and `orderId`, and patch `CANCELLED` status if picklist is found.

## Things that need improvement or todos
- Throttling doesn't seem to be working as expected... Or maybe it is...
- More validation...
- Move this to `wms-cli` or Github Action?

1231231