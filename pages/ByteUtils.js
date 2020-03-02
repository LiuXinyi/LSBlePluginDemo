
// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
  if (buffer === null || buffer === undefined) {
    return '';
  }
  if (typeof (buffer) === 'string') {
    return buffer;
  }
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

module.exports = {
ab2hex,
}