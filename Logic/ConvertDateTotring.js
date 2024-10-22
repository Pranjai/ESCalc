module.exports = {
    ConvertDateTotring : function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);
  
    var interval = seconds / 31536000;
  
    if (interval > 1) {
      return Math.floor(interval) + " years ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
  },
  ConvertToBlock: function convertToBlock(date)
  {
    let old = new Date('01/01/1970');
    let present = date;
    let diff = Math.floor(((present - old)/1000));
    let blockNo = Math.floor(((diff % 86400) / 900))+1;
    return blockNo;
  }
}