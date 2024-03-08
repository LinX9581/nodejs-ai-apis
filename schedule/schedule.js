import schedule from "node-schedule";
import { exec } from 'child_process';
import { promisify } from 'util';
import query from '../mysql-connect'
import moment from 'moment'

const execProm = promisify(exec);

// test()
async function test(){
    let a = await execProm(`mysqldump -h ${process.env.db_host} -u ${process.env.db_user} -p${process.env.db_password} www > /db/www.sql`)
}

schedule.scheduleJob("0 1 0 * * *", async function () {
  try {
    let yesterday = moment(new Date()).format("YYYY-MM-DD");
    await execProm(`mysqldump -h ${process.env.db_host} -u ${process.env.db_user} -p${process.env.db_password} www > /db/www.sql`)
    await execProm(`gsutil cp -r /db/www.sql gs://db-backup/www-${yesterday}.sql`);
  } catch (error) {
    console.log(error);
  }
});
