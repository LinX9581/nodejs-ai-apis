import query from "../mysql-connect";
import express from "express";
import moment from "moment";

// getMysqlUser()
async function getMysqlUser() {
  const user = await query("SELECT User, Host FROM mysql.user;");
  console.log(user);
  return user[0].User;
}

let router = express.Router();
router.get("/", async function (req, res) {
  let title = "Nodejs-Template ";
  let today = new moment().format("YYYY-MM-DD HH:mm:ss");
  res.render("index", {
    today,
    title,
  });
});

router.post("/", async function (req, res) {
  let ifDataExistMsg = "";
  let chack1dayAgoDataSql = "SELECT date FROM traffic.yahoo WHERE date = ?";
  let chack1dayAgoDataData = [req.body.begin_date];
  let chack1dayAgoData = await query(chack1dayAgoDataSql, chack1dayAgoDataData);
  if (chack1dayAgoData == "") {
    console.log("昨日無數據 顯示前天數據");
    ifDataExistMsg = "-1";
  } else {
    let trafficTableSql = `select * from traffic.channel INNER JOIN traffic.referer ON channel.date = referer.date WHERE channel.date BETWEEN ? AND ?`;
    let trafficTableData = [req.body.begin_date, req.body.end_date];
    let trafficTable = await query(trafficTableSql, trafficTableData);

    res.send(
      JSON.stringify({
        traffic: trafficTable,
        status: ifDataExistMsg,
      })
    );
  }
});

module.exports = router;
