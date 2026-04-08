Static dbt documentation site for the mortgage warehouse.

Generate (from repo machine with dbt + profiles configured):

  cd dashboard
  npm run docs:sync

Or manually:

  cd dbt
  dbt docs generate --target-path ../dashboard/public/dbt-docs

Then rebuild the dashboard. These files are served at /dbt-docs/ on the deployed app; Power Visualize embeds that URL below the mortgage dashboard (same idea as RyAgent’s dbt Docs on powervisualize.com).
