/**
 * 知识图解 — SVG图表绘制
 * 五行生克环、洛书九宫、二十四节气环
 */
var KnowledgeDiagrams = {
  init: function() {
    this.drawWuxing();
    this.drawLuoshu();
    this.drawJieqi();
  },

  drawWuxing: function() {
    var svg = document.getElementById('wuxingSvg');
    if (!svg) return;
    var cx = 140, cy = 140, r = 100, innerR = 40;
    var elements = [
      {name:'木',color:'#4a9',angle:-90,desc:'生发、条达'},
      {name:'火',color:'#e55',angle:-18,desc:'表达、升腾'},
      {name:'土',color:'#da5',angle:54,desc:'承载、转化'},
      {name:'金',color:'#e8c',angle:126,desc:'收敛、规则'},
      {name:'水',color:'#59c',angle:198,desc:'流动、蓄藏'}
    ];

    var html = '<svg width="280" height="280" viewBox="0 0 280 280">';

    // Draw arrows (sheng cycle)
    for (var i = 0; i < 5; i++) {
      var e1 = elements[i];
      var e2 = elements[(i + 1) % 5];
      var a1 = e1.angle * Math.PI / 180;
      var a2 = e2.angle * Math.PI / 180;
      var midAngle = (a1 + a2) / 2;
      if (Math.abs(a2 - a1) > Math.PI) midAngle += Math.PI;
      var x1 = cx + (r - 10) * Math.cos(midAngle);
      var y1 = cy + (r - 10) * Math.sin(midAngle);
      html += '<text x="' + x1 + '" y="' + y1 + '" text-anchor="middle" fill="#8b6f3a" font-size="11">生</text>';
    }

    // Draw nodes
    for (var j = 0; j < 5; j++) {
      var e = elements[j];
      var angle = e.angle * Math.PI / 180;
      var x2 = cx + r * Math.cos(angle);
      var y2 = cy + r * Math.sin(angle);
      html += '<circle cx="' + x2 + '" cy="' + y2 + '" r="26" fill="' + e.color + '" opacity="0.85"/>';
      html += '<text x="' + x2 + '" y="' + (y2 - 3) + '" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">' + e.name + '</text>';
      html += '<text x="' + x2 + '" y="' + (y2 + 14) + '" text-anchor="middle" fill="#fff" font-size="9">' + e.desc + '</text>';
    }

    // Center text
    html += '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" fill="#8b6f3a" font-size="13">五行</text>';

    html += '</svg>';
    svg.innerHTML = html;
  },

  drawLuoshu: function() {
    var svg = document.getElementById('luoshuSvg');
    if (!svg) return;

    // 洛书九宫: 4 9 2 / 3 5 7 / 8 1 6
    var grid = [
      {row:0,col:0,num:4,name:'四绿巽',dir:'东南',elem:'木'},
      {row:0,col:1,num:9,name:'九紫离',dir:'南',elem:'火'},
      {row:0,col:2,num:2,name:'二黑坤',dir:'西南',elem:'土'},
      {row:1,col:0,num:3,name:'三碧震',dir:'东',elem:'木'},
      {row:1,col:1,num:5,name:'五黄中',dir:'中',elem:'土'},
      {row:1,col:2,num:7,name:'七赤兑',dir:'西',elem:'金'},
      {row:2,col:0,num:8,name:'八白艮',dir:'东北',elem:'土'},
      {row:2,col:1,num:1,name:'一白坎',dir:'北',elem:'水'},
      {row:2,col:2,num:6,name:'六白乾',dir:'西北',elem:'金'}
    ];

    var cellSize = 70, startX = 35, startY = 30;
    var html = '<svg width="280" height="280" viewBox="0 0 280 280">';

    for (var i = 0; i < grid.length; i++) {
      var g = grid[i];
      var x = startX + g.col * cellSize;
      var y = startY + g.row * cellSize;

      var bgColor = g.num === 5 ? '#f5e6c8' : '#faf6ed';
      html += '<rect x="' + x + '" y="' + y + '" width="' + cellSize + '" height="' + cellSize + '" fill="' + bgColor + '" stroke="#d4c5a0" stroke-width="1"/>';
      html += '<text x="' + (x + cellSize/2) + '" y="' + (y + 22) + '" text-anchor="middle" fill="#8b6f3a" font-size="18" font-weight="bold">' + g.num + '</text>';
      html += '<text x="' + (x + cellSize/2) + '" y="' + (y + 42) + '" text-anchor="middle" fill="#5c4e3a" font-size="11">' + g.name + '</text>';
      html += '<text x="' + (x + cellSize/2) + '" y="' + (y + 58) + '" text-anchor="middle" fill="#8a7a60" font-size="9">' + g.dir + '·' + g.elem + '</text>';
    }

    html += '</svg>';
    svg.innerHTML = html;
  },

  drawJieqi: function() {
    var svg = document.getElementById('jieqiSvg');
    if (!svg) return;

    var terms = [
      '立春','雨水','惊蛰','春分','清明','谷雨',
      '立夏','小满','芒种','夏至','小暑','大暑',
      '立秋','处暑','白露','秋分','寒露','霜降',
      '立冬','小雪','大雪','冬至','小寒','大寒'
    ];
    var seasons = [
      {name:'春',start:0,end:5,color:'#5b9'},
      {name:'夏',start:6,end:11,color:'#e66'},
      {name:'秋',start:12,end:17,color:'#da5'},
      {name:'冬',start:18,end:23,color:'#59c'}
    ];

    var cx = 140, cy = 140, r = 110;
    var html = '<svg width="280" height="280" viewBox="0 0 280 280">';

    // Season arcs
    for (var s = 0; s < seasons.length; s++) {
      var se = seasons[s];
      var startAngle = -90 + (se.start / 24) * 360;
      var endAngle = -90 + ((se.end + 1) / 24) * 360;
      var saRad = startAngle * Math.PI / 180;
      var eaRad = endAngle * Math.PI / 180;
      var largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
      var x1 = cx + r * Math.cos(saRad);
      var y1 = cy + r * Math.sin(saRad);
      var x2 = cx + r * Math.cos(eaRad);
      var y2 = cy + r * Math.sin(eaRad);
      html += '<path d="M' + cx + ',' + cy + ' L' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ',' + y2 + ' Z" fill="' + se.color + '" opacity="0.12"/>';
    }

    // Term positions
    for (var i = 0; i < 24; i++) {
      var angle = (-90 + (i / 24) * 360) * Math.PI / 180;
      var x3 = cx + r * Math.cos(angle);
      var y3 = cy + r * Math.sin(angle);
      var isMajor = terms[i].indexOf('立') === 0 || terms[i].indexOf('春分') === 0 || terms[i].indexOf('秋分') === 0 || terms[i].indexOf('夏至') === 0 || terms[i].indexOf('冬至') === 0;
      html += '<text x="' + x3 + '" y="' + y3 + '" text-anchor="middle" dominant-baseline="central" fill="' + (isMajor ? '#8b6f3a' : '#8a7a60') + '" font-size="' + (isMajor ? '11' : '9') + '" font-weight="' + (isMajor ? 'bold' : 'normal') + '">' + terms[i] + '</text>';
    }

    // Center
    html += '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" fill="#8b6f3a" font-size="13">二十四节气</text>';

    html += '</svg>';
    svg.innerHTML = html;
  }
};

// Auto-init diagrams
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() { KnowledgeDiagrams.init(); }, 800);
});
