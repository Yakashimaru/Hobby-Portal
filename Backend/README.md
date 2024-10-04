# Setup
## Activateing venv
CD to Hobby-Portal then:

```cli
.\.venv\Scripts\activate
```

## Generating requirements.txt
1) CD to Hobby-Portal
2) Enter `pipreqs Backend --force` into the cli
3) Change `psycopg2` to `psycopg2-binary`

## Importing and exporting postgressql
### Importing
1) Using CLI: `
pg_dump -U dbusername dbname > dbexport.pgsql
`
### Exporting

