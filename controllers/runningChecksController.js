const axios = require("axios");
const axiosRetry = require("axios-retry");
const cron = require("node-cron");
const Check = require("../models/check");
const ReportModel = require("../models/Report");
const notify = require("../utils/notify");
// TODO:
// //convert sending notification into util function(done)
// FIXME:
// //correct the times and the intervals(done)

class CronService {
  constructor() {
    this.checkingList = new Map();
    this.sentMailFlag = new Map();
  }

  async sigleUrlCheck(check) {
    try {
      const client = axios.create({
        baseURL: check.url,
        timeout: check.timeout * 1000,
      });
      axiosRetry(client, { retries: check.threshold });
      const startTime = Date.now();
      let date = new Date(startTime);
      console.log(date.toISOString());
      client
        .get(check.path)
        .then(async (res) => {
          let endTime = Date.now();
          let responseTime = (endTime - startTime) / 1000;
          let report = await ReportModel.findOne({ check: check._id });
          // let check = await Check.findById(report.check);
          if (!report) {
            console.log("There is no checks found");
          } else {
            let log = `Success Status-->GET Code-->  ${res.status} --> ${responseTime}seconds`;
            if (!this.sentMailFlag[check._id]) {
              this.sentMailFlag[check._id] = true;
              notify(
                check,
                `{your check: ${check.name} is getting up successfully now }`
              );
            }
            let upTime = report.upTime + check.interval / 100;
            let historyLog = report.history;
            if (historyLog == null) historyLog = [];
            historyLog.push(log);
            let newReport = await ReportModel.findByIdAndUpdate(report._id, {
              status: res.status,
              availability: (upTime / (upTime + report.downTime)) * 100,
              upTime: upTime,
              responseTime: responseTime,
              history: historyLog,
            });
            if (newReport)
              console.log(
                `Check: ${newReport.check}, ` +
                  newReport.history[newReport.history.length - 1]
              );
          }
        })

        .catch(async (error) => {
          let endTime = Date.now();
          let responseTime = (endTime - startTime) / 1000;
          let report = await ReportModel.findOne({ check: check._id });
          if (report) {
            let downTime = report.downTime + check.interval;
            let outages = report.outages + 1;
            let status = 400;
            let log = `Fail Status-->GET Code --> ${status} --> ${responseTime}seconds`;
            if (this.sentMailFlag[check._id]) {
              this.sentMailFlag[check._id] = false;
              notify(check, `{your check: ${check.name} is getting down now }`);
            }
            let historyLog = report.history;
            if (historyLog == null) historyLog = [];
            historyLog.push(log);
            let newReport = await ReportModel.findByIdAndUpdate(report._id, {
              status: status,
              availability: (report.upTime / (report.upTime + downTime)) * 100,
              downTime: downTime,
              outages: outages,
              responseTime: responseTime,
              history: historyLog,
            });
            if (newReport)
              console.log(
                `Check: ${newReport.check}, ` +
                  newReport.history[newReport.history.length - 1]
              );
          }
        });
    } catch {
      (e) => {
        console.log("error");
      };
    }
  }

  async startContinousChecks() {
    const checks = await Check.find().populate("createdBy");
    checks.forEach((check) => {
      console.log("sssssssssssssssssssssssssssssssssssssss");
      this.sentMailFlag[check._id] = true;
      this.checkingList[check._id] = cron.schedule(
        `*/${check.interval} * * * * *`,
        () => {
          if (check) this.sigleUrlCheck(check);
        }
      );
    });
  }

  async addToCheckList(check) {
    this.sentMailFlag[check._id] = true;
    this.checkingList[check._id] = cron.schedule(
      `*/${check.interval} * * * * *`,
      () => {
        if (check) this.sigleUrlCheck(check);
      }
    );
  }

  async removeFromCheckList(check) {
    this.checkingList[check].stop();
  }
}

const cronService = new CronService();
module.exports = cronService;
