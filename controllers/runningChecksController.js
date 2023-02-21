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

class RunningChecksService {
  constructor() {
    this.checkingList = new Map();
    this.sentMailFlag = new Map();
  }

  async singleUrlCheck(check) {
    try {
      let configuration = {};
      configuration.baseURL = check.url;
      configuration.method = check.method;
      configuration.timeout = check.timeout * 1000;
      if (check.authentication) {
        configuration.auth = {
          username: check.authentication.username,
          password: check.authentication.password,
        };
      }
      const NewInstance = axios.create(configuration);
      axiosRetry(NewInstance, { retries: check.threshold });
      const startTime = Date.now();
      let date = new Date(startTime);
      console.log(date.toISOString());
      NewInstance.get(check.path)
        .then(async (res) => {
          let endTime = Date.now();
          let responseTime = (endTime - startTime) / 1000;
          let report = await ReportModel.findOne({ check: check._id });
          if (!report) {
            console.log("There is no checks found");
          } else {
            if (!this.sentMailFlag[check._id]) {
              this.sentMailFlag[check._id] = true;
              notify(
                check,
                `{your check: ${check.name} is getting up successfully now }`
              );
            }
            let upTime = report.upTime + check.interval / 100;
            let reportLogs = report.history || [];
            reportLogs.push(
              `Success Status-->GET Code-->  ${res.status} --> ${responseTime}seconds`
            );
            let newReport = await ReportModel.findByIdAndUpdate(report._id, {
              status: res.status,
              availability: (upTime / (upTime + report.downTime)) * 100,
              upTime: upTime,
              responseTime: responseTime,
              history: reportLogs,
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

            if (this.sentMailFlag[check._id]) {
              this.sentMailFlag[check._id] = false;
              notify(check, `{your check: ${check.name} is getting down now }`);
            }
            let reportLogs = report.history || [];
            reportLogs.push(
              `Fail Status-->GET Code --> ${status} --> ${responseTime}seconds`
            );
            let newReport = await ReportModel.findByIdAndUpdate(report._id, {
              status: status,
              responseTime: responseTime,
              downTime: downTime,
              outages: outages,
              availability: (report.upTime / (report.upTime + downTime)) * 100,
              history: reportLogs,
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
      this.sentMailFlag[check._id] = true;
      this.checkingList[check._id] = cron.schedule(
        `*/${check.interval} * * * * *`,
        () => {
          if (check) this.singleUrlCheck(check);
        }
      );
    });
  }

  async addToCheckList(check) {
    this.sentMailFlag[check._id] = true;
    this.checkingList[check._id] = cron.schedule(
      `*/${check.interval} * * * * *`,
      () => {
        if (check) this.singleUrlCheck(check);
      }
    );
  }

  async removeFromCheckList(check) {
    this.checkingList[check].stop();
  }
}

const runningChecksService = new RunningChecksService();
module.exports = runningChecksService;
