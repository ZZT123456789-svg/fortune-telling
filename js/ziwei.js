/**
 * 紫微斗数 — 专业命盘 SVG
 */
var ZiweiModule = {
  tianGan:['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  diZhi:['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],

  mainStars:[
    {id:'ziwei',name:'紫微',short:'紫',elem:'土'},{id:'tianji',name:'天机',short:'机',elem:'木'},
    {id:'taiyang',name:'太阳',short:'阳',elem:'火'},{id:'wuqu',name:'武曲',short:'武',elem:'金'},
    {id:'tiantong',name:'天同',short:'同',elem:'水'},{id:'lianzhen',name:'廉贞',short:'廉',elem:'火'},
    {id:'tianfu',name:'天府',short:'府',elem:'土'},{id:'taiyin',name:'太阴',short:'阴',elem:'水'},
    {id:'tanlang',name:'贪狼',short:'贪',elem:'木'},{id:'jumen',name:'巨门',short:'巨',elem:'水'},
    {id:'tianxiang',name:'天相',short:'相',elem:'水'},{id:'tianliang',name:'天梁',short:'梁',elem:'土'},
    {id:'qisha',name:'七杀',short:'杀',elem:'金'},{id:'pojun',name:'破军',short:'破',elem:'水'}
  ],
  subStars:[
    {id:'zuofu',name:'左辅',short:'辅'},{id:'youbi',name:'右弼',short:'弼'},
    {id:'wenchang',name:'文昌',short:'昌'},{id:'wenqu',name:'文曲',short:'曲'},
    {id:'tiankui',name:'天魁',short:'魁'},{id:'tianyue',name:'天钺',short:'钺'},{id:'lucun',name:'禄存',short:'存'}
  ],
  miscStars:[
    {id:'qingyang',name:'擎羊',short:'羊'},{id:'tuoluo',name:'陀罗',short:'陀'},
    {id:'huoxing',name:'火星',short:'火'},{id:'lingxing',name:'铃星',short:'铃'},
    {id:'dikong',name:'地空',short:'空'},{id:'dijie',name:'地劫',short:'劫'},{id:'tianma',name:'天马',short:'马'}
  ],
  palaces:['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'],

  _lastChart:null,_lastSiHua:null,_lastY:0,_lastM:0,_lastD:0,_lastH:0,_lastGender:'',_lastYGZ:null,_lastJu:0,

  open:function(){document.getElementById('ziweiOverlay').classList.add('active');document.getElementById('ziweiResult').style.display='none';},
  close:function(){document.getElementById('ziweiOverlay').classList.remove('active');},

  _yearGZ:function(y){var d=y-2024,g=((d%10)+10)%10,z=((d%12)+12)%12;return{gan:g,zhi:z,ganStr:this.tianGan[g],zhiStr:this.diZhi[z]};},
  _monthGZ:function(yG,m){var s=[2,4,6,8,0];return{gan:(s[yG%5]+m-1)%10,zhi:(m+1)%12};},
  _dayGZ:function(y,m,d){var r=new Date(1900,0,1),t=new Date(y,m-1,d);var df=Math.round((t-r)/86400000);return{gan:((df%10)+10)%10,zhi:((df%12)+12)%12};},
  _wuxingJu:function(g,z){var nm=[[2,2,3,4,4,5,4,4,5,0,0,3],[2,2,3,4,4,5,4,4,5,0,0,3],[3,4,4,5,0,0,3,2,2,3,4,4],[3,4,4,5,0,0,3,2,2,3,4,4],[4,4,5,0,0,3,2,2,3,4,4,5],[4,4,5,0,0,3,2,2,3,4,4,5],[4,5,0,0,3,2,2,3,4,4,5,4],[4,5,0,0,3,2,2,3,4,4,5,4],[5,0,0,3,2,2,3,4,4,5,4,4],[5,0,0,3,2,2,3,4,4,5,4,4]];var j={0:2,1:3,2:4,3:5,4:6};return j[nm[g][z]]||5;},

  _placePalaces:function(m,hz){var mz=((2-(m-1))%12+12)%12;mz=((mz-hz)%12+12)%12;var r=[];for(var i=0;i<12;i++)r.push({name:this.palaces[i],zhiIdx:((mz-i)%12+12)%12,zhi:this.diZhi[((mz-i)%12+12)%12],mainStars:[],subStars:[],miscStars:[],siHua:null,daXian:0});return{ps:r,mz:mz};},

  _placeMainStars:function(zp){var p=[];for(var i=0;i<12;i++)p[i]=[];p[zp].push(this.mainStars[0]);[{o:-1,s:1},{o:-3,s:2},{o:-4,s:3},{o:-5,s:4},{o:4,s:5}].forEach(function(f){p[((zp+f.o)%12+12)%12].push(this.mainStars[f.s]);}.bind(this));var tp=((zp-4)%12+12)%12;p[tp].push(this.mainStars[6]);[{o:1,s:7},{o:2,s:8},{o:3,s:9},{o:4,s:10},{o:5,s:11},{o:6,s:12},{o:10,s:13}].forEach(function(f){p[((tp+f.o)%12+12)%12].push(this.mainStars[f.s]);}.bind(this));return p;},

  _placeSubStars:function(yz,m,hz){var p=[];for(var i=0;i<12;i++)p[i]=[];p[(2+m-1)%12].push(this.subStars[0]);p[((10-(m-1))%12+12)%12].push(this.subStars[1]);p[((10-hz)%12+12)%12].push(this.subStars[2]);p[(2+hz)%12].push(this.subStars[3]);p[(m+2)%12].push(this.subStars[4]);p[(m+8)%12].push(this.subStars[5]);p[({0:2,1:5,2:8,3:11,4:2,5:5,6:8,7:11,8:2,9:5})[(m*3+5)%10]||2].push(this.subStars[6]);return p;},

  _placeMiscStars:function(yz,m,hz){var p=[];for(var i=0;i<12;i++)p[i]=[];var lp=({0:2,1:5,2:8,3:11,4:2,5:5,6:8,7:11,8:2,9:5})[(m*3+5)%10]||2;p[(lp+1)%12].push(this.miscStars[0]);p[(lp-1+12)%12].push(this.miscStars[1]);p[(yz+hz)%12].push(this.miscStars[2]);p[(yz+hz+6)%12].push(this.miscStars[3]);p[(hz+2)%12].push(this.miscStars[4]);p[(hz+8)%12].push(this.miscStars[5]);p[({0:2,1:2,2:2,3:8,4:8,5:8,6:5,7:5,8:5,9:11,10:11,11:11})[yz]||2].push(this.miscStars[6]);return p;},

  _getSiHua:function(yg){var m={0:['廉贞','破军','武曲','太阳'],1:['天机','天梁','紫微','太阴'],2:['天同','天机','文昌','廉贞'],3:['太阴','天同','天机','巨门'],4:['贪狼','太阴','右弼','天机'],5:['武曲','贪狼','天梁','文曲'],6:['太阳','武曲','太阴','天同'],7:['巨门','太阳','文曲','文昌'],8:['天梁','紫微','左辅','武曲'],9:['破军','巨门','太阴','贪狼']};return m[yg]||m[0];},

  _getDaXian:function(ju,g,yg){var f=(yg%2===0&&g==='男')||(yg%2!==0&&g==='女');var r=[];for(var i=0;i<12;i++)r.push(f?ju+i*10:ju+(11-i)*10);return r;},

  calculate:function(){
    var y=parseInt(document.getElementById('ziweiYear').value),m=parseInt(document.getElementById('ziweiMonth').value),d=parseInt(document.getElementById('ziweiDay').value),h=parseInt(document.getElementById('ziweiHour').value),g=document.getElementById('ziweiGender').value;
    if(!y||!m||!d||isNaN(h)){alert('请填写完整出生信息');return;}
    var hz=Math.floor(h/2)%12,yGZ=this._yearGZ(y);
    var chart=this._placePalaces(m,hz);
    var mGZ=this._monthGZ(yGZ.gan,m);chart.mz=chart.ps[0].zhiIdx;chart.mg=(mGZ.gan*2+chart.mz)%10;
    var ju=this._wuxingJu(chart.mg,chart.mz);
    var zwPos=(([2,5,8,11,1,4,7,10,0,3,6,9][(d-1+(ju-2)*2)%12])%12+12)%12;
    var mm=this._placeMainStars(zwPos),sm=this._placeSubStars(yGZ.zhi,m,hz),xm=this._placeMiscStars(yGZ.zhi,m,hz);
    for(var i=0;i<12;i++){chart.ps[i].mainStars=mm[chart.ps[i].zhiIdx]||[];chart.ps[i].subStars=sm[chart.ps[i].zhiIdx]||[];chart.ps[i].miscStars=xm[chart.ps[i].zhiIdx]||[];}
    var siHua=this._getSiHua(yGZ.gan),daXian=this._getDaXian(ju,g,yGZ.gan);
    for(var j=0;j<12;j++)chart.ps[j].daXian=daXian[j];
    var now=new Date();chart.ln={year:now.getFullYear(),gan:this.tianGan[((now.getFullYear()-4)%10+10)%10],zhi:this.diZhi[((now.getFullYear()-4)%12+12)%12]};
    this._lastChart=chart;this._lastSiHua=siHua;this._lastY=y;this._lastM=m;this._lastD=d;this._lastH=h;this._lastGender=g;this._lastYGZ=yGZ;this._lastJu=ju;
    this._renderSVG(chart,siHua,y,m,d,h,g,yGZ,ju);
    Paywall.blockAll('ziweiResult');
  },

  _renderSVG:function(chart,siHua,y,m,d,h,g,yGZ,ju){
    var ctn=document.getElementById('ziweiResult');ctn.style.display='block';
    var W=700,H=830,mx=35,my=100,cw=155,ch=140;
    var gp=[{r:0,c:1},{r:0,c:2},{r:0,c:3},{r:1,c:3},{r:2,c:3},{r:2,c:2},{r:2,c:1},{r:2,c:0},{r:1,c:0},{r:1,c:1},{r:0,c:0},{r:1,c:2}];
    var shc={禄:'#1a8',权:'#e80',科:'#48c',忌:'#c44'};
    var self=this;

    var html='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg"><rect width="'+W+'" height="'+H+'" fill="#fdfaf3"/>';

    // 标题
    html+='<text x="'+(W/2)+'" y="28" text-anchor="middle" font-family="KaiTi,serif" font-size="20" fill="#5c3a1a" font-weight="bold">紫微斗数命盘</text>';
    html+='<text x="'+(W/2)+'" y="50" text-anchor="middle" font-family="KaiTi,serif" font-size="12" fill="#8a7a60">'+y+'-'+m+'-'+d+' '+h+'时 · '+g+' · '+yGZ.ganStr+yGZ.zhiStr+'年 · 五行'+ju+'局</text>';

    // 中心信息面板
    var cpx=mx+cw*2,cpy=my+ch,cpw=cw,cph=ch;
    html+='<rect x="'+cpx+'" y="'+cpy+'" width="'+cpw+'" height="'+cph+'" fill="#fef9ee" stroke="#c9a56a" stroke-width="1.5"/>';
    html+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+22)+'" text-anchor="middle" font-size="11" fill="#8a7a60">'+yGZ.ganStr+yGZ.zhiStr+'年 '+ju+'局</text>';
    html+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+44)+'" text-anchor="middle" font-size="11" fill="#8a7a60">'+g+' · '+self.shengxiao[(y-4)%12]||''+'</text>';
    html+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+66)+'" text-anchor="middle" font-size="10" fill="#aaa">流年 '+chart.ln.year+'</text>';
    html+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+84)+'" text-anchor="middle" font-size="10" fill="#aaa">'+chart.ln.gan+chart.ln.zhi+'年</text>';
    html+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+106)+'" text-anchor="middle" font-size="11" fill="#c9a56a">命宫:'+chart.ps[0].zhi+'</text>';
    html+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+126)+'" text-anchor="middle" font-size="10" fill="#aaa">身宫:——</text>';

    // 绘制12宫
    for(var i=0;i<12;i++){
      var gpx=mx+gp[i].c*cw,gpy=my+gp[i].r*ch,p=chart.ps[i];
      var fill=i===0?'#fef9ee':'#fdfaf5', stroke=i===0?'#c9a040':'#d4c5a0',sw=i===0?'1.5':'0.8';
      html+='<rect x="'+gpx+'" y="'+gpy+'" width="'+cw+'" height="'+ch+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';

      // 宫名
      html+='<text x="'+(gpx+cw/2)+'" y="'+(gpy+17)+'" text-anchor="middle" font-family="KaiTi,serif" font-size="13" fill="#5c3a1a" font-weight="bold">'+p.name+'</text>';
      // 地支
      html+='<text x="'+(gpx+12)+'" y="'+(gpy+15)+'" text-anchor="middle" font-size="9" fill="#c9a56a">'+p.zhi+'</text>';
      // 大限
      html+='<text x="'+(gpx+cw-12)+'" y="'+(gpy+15)+'" text-anchor="end" font-size="8" fill="#aaa">'+p.daXian+'~'+(p.daXian+9)+'岁</text>';

      var cy=gpy+35,lh=17;
      // 主星（大字）
      for(var ms=0;ms<p.mainStars.length;ms++){
        var star=p.mainStars[ms],sh='';
        for(var k in siHua) if(siHua[k]===star.name){sh=k;break;}
        var sc=sh?shc[sh]:'#4a2a0a';
        if(sh){
          html+='<rect x="'+(gpx+4)+'" y="'+(cy-10)+'" width="'+(cw-8)+'" height="14" rx="3" fill="'+shc[sh]+'" opacity="0.1"/>';
          html+='<circle cx="'+(gpx+14)+'" cy="'+(cy-5)+'" r="5" fill="'+shc[sh]+'"/>';
          html+='<text x="'+(gpx+14)+'" y="'+(cy-3)+'" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold">'+sh+'</text>';
        }
        html+='<text x="'+(gpx+26)+'" y="'+cy+'" font-family="KaiTi,serif" font-size="12" fill="'+sc+'" font-weight="bold">'+star.name+'</text>';
        cy+=lh;
      }
      // 副星
      for(var ss=0;ss<p.subStars.length;ss++){
        html+='<text x="'+(gpx+8)+'" y="'+cy+'" font-size="9" fill="#7a6a4a">'+p.subStars[ss].short+' '+p.subStars[ss].name+'</text>';
        cy+=14;
      }
      // 杂星
      var mtext='';
      for(var mc=0;mc<p.miscStars.length;mc++)mtext+=p.miscStars[mc].short+' ';
      if(mtext)html+='<text x="'+(gpx+8)+'" y="'+cy+'" font-size="8" fill="#aaa">'+mtext.trim()+'</text>';
    }

    // 四化图例
    var lx=mx,ly=my+ch*3+20;
    var shEnt=[{k:'禄',v:siHua[0]},{k:'权',v:siHua[1]},{k:'科',v:siHua[2]},{k:'忌',v:siHua[3]}];
    html+='<text x="'+lx+'" y="'+ly+'" font-size="10" fill="#8a7a60">四化：</text>';
    shEnt.forEach(function(se,i){
      var sx=lx+45+i*130;
      html+='<circle cx="'+(sx+8)+'" cy="'+(ly-5)+'" r="6" fill="'+shc[se.k]+'"/>';
      html+='<text x="'+(sx+8)+'" y="'+(ly-2)+'" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold">'+se.k+'</text>';
      html+='<text x="'+(sx+18)+'" y="'+ly+'" font-size="9" fill="#5c3a1a">'+se.k+'：'+se.v+'</text>';
    });

    // 三合虚线
    var tri=[[0,4,8],[1,5,9],[2,6,10],[3,7,11]];
    tri.forEach(function(th){
      var cc=th.map(function(i){return{x:mx+gp[i].c*cw+cw/2,y:my+gp[i].r*ch+ch/2};});
      html+='<polygon points="'+cc[0].x+','+cc[0].y+' '+cc[1].x+','+cc[1].y+' '+cc[2].x+','+cc[2].y+'" fill="none" stroke="rgba(180,150,100,0.25)" stroke-width="1" stroke-dasharray="5,5"/>';
    });

    html+='</svg>';

    ctn.innerHTML=html+
      '<p style="text-align:center;font-size:0.78rem;color:var(--text-muted);margin-top:0.5rem;">紫微斗数排盘 · 十四主星+辅星+杂星+四化+大限 · 仅供娱乐参考</p>'+
      '<button class="btn-secondary" onclick="ZiweiModule.close()">🔙 返回</button>';
  }
};

ZiweiModule.shengxiao=['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
