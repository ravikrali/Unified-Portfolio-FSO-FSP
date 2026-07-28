const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "data", "portfolio.sqlite");
const outputPath = path.join(root, "public", "portfolio.sqlite");

async function buildPublicDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(root, "node_modules", "sql.js", "dist", file),
  });
  const database = new SQL.Database(fs.readFileSync(sourcePath));

  database.run(`
    DELETE FROM email_outbox;
    DELETE FROM kpi_comments;
    DELETE FROM users WHERE id <> 'user-org-1';
    DELETE FROM engagements WHERE id <> 'eng-mock';
    DELETE FROM systems_landscape WHERE engagement_id <> 'eng-mock';
    DELETE FROM engagement_process_zones WHERE engagement_id <> 'eng-mock';
    DELETE FROM kpi_metrics WHERE engagement_id <> 'eng-mock';
    DELETE FROM task_actions WHERE engagement_id <> 'eng-mock';
    DELETE FROM notifications WHERE engagement_id <> 'eng-mock';
    DELETE FROM comments WHERE engagement_id <> 'eng-mock';
    DELETE FROM custom_requirements WHERE engagement_id <> 'eng-mock';
    DELETE FROM attachments WHERE engagement_id <> 'eng-mock';
    DELETE FROM agile_items WHERE engagement_id <> 'eng-mock';
    DELETE FROM sponsors WHERE engagement_id <> 'eng-mock';
    DELETE FROM studies WHERE engagement_id <> 'eng-mock';
    DELETE FROM fsp_requirements WHERE engagement_id <> 'eng-mock';
  `);

  fs.writeFileSync(outputPath, Buffer.from(database.export()));
  database.close();
  console.log("Created a sanitized demo database for the Cloudflare build.");
}

buildPublicDatabase().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
