Static dbt documentation site for the mortgage warehouse.

Generate (from repo machine with dbt + profiles configured):

  cd dashboard
  npm run docs:sync

Or manually:

  cd dbt
  dbt docs generate --target-path ../dashboard/public/dbt-docs

Then rebuild the dashboard. The UI loads /dbt-docs/ in an iframe under "dbt & lineage".
