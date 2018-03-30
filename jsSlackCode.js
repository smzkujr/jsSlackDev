var SLACK_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty("SLACK_ACCESS_TOKEN");

/* チャンネル名を検索してIDを取得 */
function channelNameToId(name) {
  var res = UrlFetchApp.fetch('https://slack.com/api/channels.list?token=' + SLACK_ACCESS_TOKEN);
  var channelsList = JSON.parse(res.getContentText());
  var foundChannelsId = '';
  var isFound = channelsList.channels.some(function(channels){
    if (channels.name.match(name)){
      foundChannelsId = channels.id;
      return true;
    }
  });
  return foundChannelsId;
}

function elapsedDaysToUnixTime(days){
  var date = new Date();
  var now = Math.floor(date.getTime()/ 1000); // unixtime[sec]
  return now - 8.64e4 * days + '' // 8.64e4[sec] = 1[day] 文字列じゃないと動かないので型変換している
}

/* ファイルのリスト */
function filesList(data){
  var params = {
    'token': SLACK_ACCESS_TOKEN,
    'channel': data.channel,
    'ts_from': data.ts_from,
    'count': data.count
  }
  var options = {
    'method': 'POST',
    'payload': params
  }
  var res = UrlFetchApp.fetch('https://slack.com/api/files.list',options);
  return JSON.parse(res.getContentText());
}

/* ファイルを削除 */
function filesDelete(fileid) {
  var params = {
    'token': SLACK_ACCESS_TOKEN,
    'file': fileid
  }
  var options = {
    'method': 'POST',
    'payload': params
  }
  UrlFetchApp.fetch('https://slack.com/api/files.delete',options);
}


/* 雑談チャンネル・グループの名称を検索して古いファイルを削除 */
function oldFileExecutioner(){
  const targetChannels = PropertiesService.getScriptProperties().getProperty("TARGET_CHANNEL").split(",");
  targetChannels.forEach(deleteOldFile);
}

/* 指定チャンネル内・特定日数より以前のファイルを削除 */
function deleteOldFile(channelName) {
  const days = 10;  // 遡る日数(ユーザが指定)

  var channelId = channelNameToId(channelName);
  if(!channelId){
    Logger.log('Not found "' + channelName + '". Skipping.');
    return -1; //見つからなければ終了
  }
  Logger.log('Found "' + channelName + '"(' + channelId + ')');
  var options = {
    channel: channelId,
    ts_from: elapsedDaysToUnixTime(days),
    count: 1000
  }

  filesList(options).files.forEach(function(val){
    data = filesDelete(val.id);
    //if (data.error) Logger.log('  Failed to delete file ' + val.name + ' Error: ' + data.error);
    Logger.log('  Deleted file "' + val.name + '"(' + val.id + ')');
  });
}
