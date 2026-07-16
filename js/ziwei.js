/**
 * 紫微斗数 — 文墨天机风格 · 飞星盘
 * 完整安星法 + 十四主星 + 六吉六煞 + 四化 + 庙旺 + 三合
 */
var ZiweiModule = {
  tg:['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  dz:['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  sx:['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'],

  // 主星+庙旺表(按地支 子0丑1寅2...)
  stars:[
    {id:'ziwei',name:'紫微',short:'紫',elem:'土', bright:[3,2,3,3,3,3,3,3,2,2,1,1]},
    {id:'tianji',name:'天机',short:'机',elem:'木', bright:[3,1,3,3,2,2,2,3,1,1,3,1]},
    {id:'taiyang',name:'太阳',short:'阳',elem:'火', bright:[1,1,3,3,3,3,2,3,2,1,1,1]},
    {id:'wuqu',name:'武曲',short:'武',elem:'金', bright:[3,3,2,3,3,3,2,3,3,2,2,3]},
    {id:'tiantong',name:'天同',short:'同',elem:'水', bright:[3,2,3,2,1,1,3,2,2,3,3,2]},
    {id:'lianzhen',name:'廉贞',short:'廉',elem:'火', bright:[2,3,3,3,3,3,2,3,2,1,3,2]},
    {id:'tianfu',name:'天府',short:'府',elem:'土', bright:[3,3,3,3,3,3,3,3,2,2,3,3]},
    {id:'taiyin',name:'太阴',short:'阴',elem:'水', bright:[3,3,2,1,1,1,1,2,3,3,3,3]},
    {id:'tanlang',name:'贪狼',short:'贪',elem:'木', bright:[2,3,3,2,3,3,2,3,3,3,2,3]},
    {id:'jumen',name:'巨门',short:'巨',elem:'水', bright:[3,3,2,3,3,2,3,3,2,3,3,3]},
    {id:'tianxiang',name:'天相',short:'相',elem:'水', bright:[3,3,3,3,1,1,3,3,1,2,3,3]},
    {id:'tianliang',name:'天梁',short:'梁',elem:'土', bright:[3,3,3,3,3,3,3,3,2,1,3,3]},
    {id:'qisha',name:'七杀',short:'杀',elem:'金', bright:[3,3,2,3,3,3,3,3,2,3,3,3]},
    {id:'pojun',name:'破军',short:'破',elem:'水', bright:[3,3,2,1,3,3,3,3,2,1,3,1]}
  ],
  // 亮度映射：3=庙 2=旺 1=平 0=陷
  brightMap:{3:'庙',2:'旺',1:'平',0:'陷'},

  // 副星数据
  subData:[
    {id:'zuofu',name:'左辅',short:'辅'},{id:'youbi',name:'右弼',short:'弼'},
    {id:'wenchang',name:'文昌',short:'昌'},{id:'wenqu',name:'文曲',short:'曲'},
    {id:'tiankui',name:'天魁',short:'魁'},{id:'tianyue',name:'天钺',short:'钺'},
    {id:'lucun',name:'禄存',short:'存'},{id:'qingyang',name:'擎羊',short:'羊'},
    {id:'tuoluo',name:'陀罗',short:'陀'},{id:'huoxing',name:'火星',short:'火'},
    {id:'lingxing',name:'铃星',short:'铃'},{id:'dikong',name:'地空',short:'空'},
    {id:'dijie',name:'地劫',short:'劫'},{id:'tianma',name:'天马',short:'马'},{id:'tianku',name:'天哭',short:'哭'},{id:'tianxu',name:'天虚',short:'虚'},{id:'hongluan',name:'红鸾',short:'鸾'},{id:'tianxi',name:'天喜',short:'喜'},{id:'tianyao',name:'天姚',short:'姚'},{id:'xianchi',name:'咸池',short:'咸'}
  ],

  palaces:['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'],

  // 安命宫+身宫(表)
  _mingShenTable:[
    // 生月\生时:子丑寅卯辰巳午未申酉戌亥
    [2,1,0,11,10,9,8,7,6,5,4,3], //正月
    [3,2,1,0,11,10,9,8,7,6,5,4], //二月
    [4,3,2,1,0,11,10,9,8,7,6,5], //三月
    [5,4,3,2,1,0,11,10,9,8,7,6], //四月
    [6,5,4,3,2,1,0,11,10,9,8,7], //五月
    [7,6,5,4,3,2,1,0,11,10,9,8], //六月
    [8,7,6,5,4,3,2,1,0,11,10,9], //七月
    [9,8,7,6,5,4,3,2,1,0,11,10], //八月
    [10,9,8,7,6,5,4,3,2,1,0,11], //九月
    [11,10,9,8,7,6,5,4,3,2,1,0], //十月
    [0,11,10,9,8,7,6,5,4,3,2,1],  //冬月
    [1,0,11,10,9,8,7,6,5,4,3,2]    //腊月
  ],

  // 五行局表(命宫干支→局)
  _juTable:[[2,2,3,4,4,5,4,4,5,0,0,3],[2,2,3,4,4,5,4,4,5,0,0,3],[3,4,4,5,0,0,3,2,2,3,4,4],[3,4,4,5,0,0,3,2,2,3,4,4],[4,4,5,0,0,3,2,2,3,4,4,5],[4,4,5,0,0,3,2,2,3,4,4,5],[4,5,0,0,3,2,2,3,4,4,5,4],[4,5,0,0,3,2,2,3,4,4,5,4],[5,0,0,3,2,2,3,4,4,5,4,4],[5,0,0,3,2,2,3,4,4,5,4,4]],

  // 四化表
  _siHuaTable:{0:['廉贞','破军','武曲','太阳'],1:['天机','天梁','紫微','太阴'],2:['天同','天机','文昌','廉贞'],3:['太阴','天同','天机','巨门'],4:['贪狼','太阴','右弼','天机'],5:['武曲','贪狼','天梁','文曲'],6:['太阳','武曲','太阴','天同'],7:['巨门','太阳','文曲','文昌'],8:['天梁','紫微','左辅','武曲'],9:['破军','巨门','太阴','贪狼']},

  // 火星铃星表(年支+时支)
  _huoLingTable:{子:{火:[2,3,4,5,6,7,8,9,10,11,0,1],铃:[11,0,1,2,3,4,5,6,7,8,9,10]},丑:{火:[2,3,4,5,6,7,8,9,10,11,0,1],铃:[11,0,1,2,3,4,5,6,7,8,9,10]},寅:{火:[1,2,3,4,5,6,7,8,9,10,11,0],铃:[10,11,0,1,2,3,4,5,6,7,8,9]},卯:{火:[1,2,3,4,5,6,7,8,9,10,11,0],铃:[10,11,0,1,2,3,4,5,6,7,8,9]},辰:{火:[0,1,2,3,4,5,6,7,8,9,10,11],铃:[0,1,2,3,4,5,6,7,8,9,10,11]},巳:{火:[11,0,1,2,3,4,5,6,7,8,9,10],铃:[1,2,3,4,5,6,7,8,9,10,11,0]},午:{火:[10,11,0,1,2,3,4,5,6,7,8,9],铃:[2,3,4,5,6,7,8,9,10,11,0,1]},未:{火:[9,10,11,0,1,2,3,4,5,6,7,8],铃:[1,2,3,4,5,6,7,8,9,10,11,0]},申:{火:[10,11,0,1,2,3,4,5,6,7,8,9],铃:[2,3,4,5,6,7,8,9,10,11,0,1]},酉:{火:[4,5,6,7,8,9,10,11,0,1,2,3],铃:[8,9,10,11,0,1,2,3,4,5,6,7]},戌:{火:[4,5,6,7,8,9,10,11,0,1,2,3],铃:[8,9,10,11,0,1,2,3,4,5,6,7]},亥:{火:[3,4,5,6,7,8,9,10,11,0,1,2],铃:[7,8,9,10,11,0,1,2,3,4,5,6]}},

  _last:null,

  open:function(){document.getElementById('ziweiOverlay').classList.add('active');document.getElementById('ziweiResult').style.display='none';},
  close:function(){document.getElementById('ziweiOverlay').classList.remove('active');},

  _yGZ:function(y){var d=y-2024;return{gan:((d%10)+10)%10,zhi:((d%12)+12)%12};},

  /** 农历→阳历近似 */
  _lunarToSolar:function(ly,lm,ld){var d=new Date(ly,lm-1,ld+28);return{y:d.getFullYear(),m:d.getMonth()+1,d:d.getDate()};},

  calculate:function(){
    var y=parseInt(document.getElementById('ziweiYear').value),m=parseInt(document.getElementById('ziweiMonth').value),d=parseInt(document.getElementById('ziweiDay').value),h=parseInt(document.getElementById('ziweiHour').value),g=document.getElementById('ziweiGender').value,calType=document.getElementById('ziweiCalType')?document.getElementById('ziweiCalType').value:'solar';
    if(!y||!m||!d||isNaN(h)){alert('请填写完整出生信息');return;}

    // 农历转阳历
    if(calType==='lunar'){var sol=this._lunarToSolar(y,m,d);y=sol.y;m=sol.m;d=sol.d;}

    var hz=Math.floor((h+1)/2)%12, yG=this._yGZ(y);

    // 1. 定命宫身宫
    var mingZhi=this._mingShenTable[(m-1+12)%12][hz];
    var shenZhi=this._mingShenTable[(m-1+12)%12][(14-hz)%12]; // 身宫=命宫顺时针数

    // 2. 十二宫
    var ps=[];for(var i=0;i<12;i++)ps.push({name:this.palaces[i],zhiIdx:((mingZhi-i)%12+12)%12,zhi:this.dz[((mingZhi-i)%12+12)%12],ms:[],ss:[],xs:[],shen:(i===0),dx:0,bright:[]});

    // 3. 定命宫干支→五行局
    var mGZ=this._yGZ(y);var mg=(mGZ.gan*2+mingZhi)%10;
    var juN=this._juTable[mg][mingZhi];var juMap={0:2,1:3,2:4,3:5,4:6};var ju=juMap[juN]||5;

    // 4. 紫微星定位(生日÷局数)
    var zwTable={2:[2,4,6,8,10,0,8,10,0,2,4,6],3:[2,4,6,8,10,0,4,6,8,10,0,2],4:[2,4,6,8,10,0,5,7,9,11,1,3],5:[2,4,6,8,10,0,2,4,6,8,10,0],6:[2,4,6,8,10,0,9,11,1,3,5,7]};
    var zwPos=zwTable[ju]?zwTable[ju][(d-1)%12]:2;

    // 5. 安十四主星(紫微系+天府系)
    var sm=[];for(var i2=0;i2<12;i2++)sm[i2]=[];
    sm[zwPos].push({s:0,b:zwPos}); // 紫微
    [{o:-1,s:1},{o:-3,s:2},{o:-4,s:3},{o:-5,s:4},{o:4,s:5}].forEach(function(f){var pos=((zwPos+f.o)%12+12)%12;sm[pos].push({s:f.s,b:pos});});
    var tfPos=((zwPos-4)%12+12)%12;sm[tfPos].push({s:6,b:tfPos});
    [{o:1,s:7},{o:2,s:8},{o:3,s:9},{o:4,s:10},{o:5,s:11},{o:6,s:12},{o:10,s:13}].forEach(function(f){var pos=((tfPos+f.o)%12+12)%12;sm[pos].push({s:f.s,b:pos});});

    // 6. 安辅星(正确规则)
    var ss=[];for(var i3=0;i3<12;i3++)ss[i3]=[];
    var xs=[];for(var i4=0;i4<12;i4++)xs[i4]=[];
    var lm=m; //农历月
    var lhr=hz; //时辰地支

    // 左辅(正月辰起顺行) 右弼(正月戌起逆行)
    ss[(2+lm-1)%12].push(0); //左辅→辰(2)起
    ss[((10-(lm-1))%12+12)%12].push(1); //右弼→戌(10)起
    // 文昌(子时戌起顺行) 文曲(子时辰起顺行)
    ss[((10+lhr)%12)].push(2); ss[((2+lhr)%12)].push(3);
    // 天魁天钺(年干)
    var kg={0:[1,9],1:[0,8],2:[11,7],3:[10,6],4:[1,9],5:[0,8],6:[11,7],7:[10,6],8:[1,9],9:[0,8]};
    ss[kg[yG.gan][0]].push(4);ss[kg[yG.gan][1]].push(5);
    // 禄存(年干:甲寅0→2)
    var lc={0:2,1:5,2:8,3:11,4:2,5:5,6:8,7:11,8:2,9:5};var lp=lc[yG.gan]||2;ss[lp].push(6);
    // 擎羊陀罗(禄存前后)
    xs[(lp+1)%12].push(0);xs[(lp-1+12)%12].push(1);
    // 火星铃星(年支+时支)
    var hl=this._huoLingTable[this.dz[yG.zhi]];
    if(hl){xs[hl.火[lhr]].push(2);xs[hl.铃[lhr]].push(3);}
    // 地空地劫(时支)
    xs[(lhr+2)%12].push(4);xs[(lhr+8)%12].push(5);
    // 天马(年支:亥卯未→巳5,申子辰→寅2,巳酉丑→亥11,寅午戌→申8)
    var tm={0:2,1:2,2:2,3:8,4:8,5:8,6:5,7:5,8:5,9:11,10:11,11:11};xs[tm[yG.zhi]||2].push(6);
    // 天哭(年支卯起顺行) 天虚(年支酉起顺行)
    var tkStart={0:2,1:3,2:4,3:5,4:6,5:7,6:8,7:9,8:10,9:11,10:0,11:1};xs[tkStart[yG.zhi]||2].push(7); //天哭=7
    var txStart={0:8,1:9,2:10,3:11,4:0,5:1,6:2,7:3,8:4,9:5,10:6,11:7};xs[txStart[yG.zhi]||8].push(8); //天虚=8
    // 红鸾(年支卯起顺行) 天喜(对冲)
    var hlStart={0:2,1:3,2:4,3:5,4:6,5:7,6:8,7:9,8:10,9:11,10:0,11:1};xs[hlStart[yG.zhi]||2].push(9); //红鸾=9
    var tx2Start={0:8,1:9,2:10,3:11,4:0,5:1,6:2,7:3,8:4,9:5,10:6,11:7};xs[tx2Start[yG.zhi]||8].push(10); //天喜=10
    // 天姚(年支午起顺行) 咸池(年支卯起顺行)
    var tyStart={0:5,1:6,2:7,3:8,4:9,5:10,6:11,7:0,8:1,9:2,10:3,11:4};xs[tyStart[yG.zhi]||5].push(11); //天姚=11
    var xcStart={0:2,1:3,2:4,3:5,4:6,5:7,6:8,7:9,8:10,9:11,10:0,11:1};xs[xcStart[yG.zhi]||2].push(12); //咸池=12

    // 分配到12宫
    for(var i5=0;i5<12;i5++){
      ps[i5].ms=sm[ps[i5].zhiIdx]||[];
      ps[i5].ss=ss[ps[i5].zhiIdx]||[];
      ps[i5].xs=xs[ps[i5].zhiIdx]||[];
    }

    // 7. 四化
    var sh=this._siHuaTable[yG.gan]||['廉贞','破军','武曲','太阳'];

    // 8. 大限
    var isYang=yG.gan%2===0, isMale=g==='男', fwd=(isYang&&isMale)||(!isYang&&!isMale);
    for(var i6=0;i6<12;i6++)ps[i6].dx=fwd?(ju+i6*10):(ju+(11-i6)*10);

    // 9. 当前流年
    var now=new Date(),lnG=((now.getFullYear()-4)%10+10)%10,lnZ=((now.getFullYear()-4)%12+12)%12;

    // 10. 农历近似
    var lm2=((m+1)%12+12)%12||12;var ld2=Math.min(d,30);
    var lmName=['正','二','三','四','五','六','七','八','九','十','冬','腊'];
    var ldName=['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

    this._render(ps,sh,{y:y,m:m,d:d,h:h,g:g,yG:yG,ju:ju,mingZhi:mingZhi,shenZhi:shenZhi,lnYear:now.getFullYear(),lnGan:this.tg[lnG],lnZhi:this.dz[lnZ],lunarMonth:lmName[lm2-1],lunarDay:ldName[ld2-1],mg:mg});
    Paywall.blockAll('ziweiResult');
  },

  _render:function(ps,sh,info){
    var ctn=document.getElementById('ziweiResult');ctn.style.display='block';
    var W=760,H=850,mx=10,my=150,cw=180,chH=160;
    var gp=[{r:0,c:0},{r:0,c:1},{r:0,c:2},{r:0,c:3},{r:1,c:0},{r:1,c:3},{r:2,c:0},{r:2,c:3},{r:3,c:0},{r:3,c:1},{r:3,c:2},{r:3,c:3}];
    var pO=[2,1,0,11, 3,10, 4,9, 5,6,7,8];
    var self=this, shc={禄:'#1a8',权:'#e80',科:'#48c',忌:'#c44'};
    var name=document.getElementById('ziweiName')?document.getElementById('ziweiName').value||'未命名':'未命名';

    var svg='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg"><rect width="'+W+'" height="'+H+'" fill="#fdfaf3"/>';

    svg+='<text x="'+(W/2)+'" y="22" text-anchor="middle" font-family="KaiTi,serif" font-size="22" fill="#333" font-weight="bold">紫微斗数 · 飞星盘</text>';
    svg+='<text x="'+(W/2)+'" y="46" text-anchor="middle" font-size="15" fill="#888">'+info.y+'-'+info.m+'-'+info.d+' '+info.h+'时 · '+info.g+' · 农历'+info.lunarMonth+'月'+info.lunarDay+' · '+info.yG.gan+self.dz[info.yG.zhi]+'年 · '+info.ju+'局</text>';

    // 三合连线(四组三角)
    var tri=[[0,4,8],[1,5,9],[2,6,10],[3,7,11]];
    tri.forEach(function(t){
      var pts=[];for(var ti=0;ti<3;ti++){var gi=pO.indexOf(t[ti]);if(gi>=0)pts.push({x:mx+gp[gi].c*cw+cw/2,y:my+gp[gi].r*chH+chH/2});}
      if(pts.length===3)svg+='<polygon points="'+pts[0].x+','+pts[0].y+' '+pts[1].x+','+pts[1].y+' '+pts[2].x+','+pts[2].y+'" fill="none" stroke="#c9a56a" stroke-width="2" stroke-dasharray="8,5" opacity="0.5"/>';
    });
    // 对宫连线(六条直线)
    var dui=[[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
    dui.forEach(function(d){
      var a=pO.indexOf(d[0]),b=pO.indexOf(d[1]);
      if(a>=0&&b>=0)svg+='<line x1="'+(mx+gp[a].c*cw+cw/2)+'" y1="'+(my+gp[a].r*chH+chH/2)+'" x2="'+(mx+gp[b].c*cw+cw/2)+'" y2="'+(my+gp[b].r*chH+chH/2)+'" stroke="#d4c5a0" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>';
    });

    // 中宫(2×2合并)
    var cpx=mx+cw,cpy=my+chH,cpw=cw*2,cph=chH*2;
    svg+='<rect x="'+cpx+'" y="'+cpy+'" width="'+cpw+'" height="'+cph+'" fill="#fef9ee" stroke="#c9a56a" stroke-width="2"/>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+26)+'" text-anchor="middle" font-size="18" fill="#333" font-weight="bold">'+name+'</text>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+52)+'" text-anchor="middle" font-size="15" fill="#666">'+info.yG.gan+self.dz[info.yG.zhi]+'年 '+info.g+' '+info.ju+'局</text>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+74)+'" text-anchor="middle" font-size="12" fill="#888">农历'+info.lunarMonth+'月'+info.lunarDay+'</text>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+94)+'" text-anchor="middle" font-size="12" fill="#888">真太阳时 '+String(info.h).padStart(2,'0')+':00</text>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+114)+'" text-anchor="middle" font-size="11" fill="#888">命宫:'+self.dz[info.mingZhi]+' 身宫:'+self.dz[info.shenZhi]+'</text>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+134)+'" text-anchor="middle" font-size="10" fill="#aaa">流年 '+info.lnYear+' '+info.lnGan+info.lnZhi+'年</text>';

    // 四化图例
    var shEnt=[{k:'禄',v:sh[0]},{k:'权',v:sh[1]},{k:'科',v:sh[2]},{k:'忌',v:sh[3]}];
    var lx=mx,ly=my+chH*4+25;
    svg+='<text x="'+lx+'" y="'+ly+'" font-size="10" fill="#888">四化：</text>';
    shEnt.forEach(function(se,i){var sx=lx+40+i*145;
      svg+='<circle cx="'+(sx+8)+'" cy="'+(ly-5)+'" r="6" fill="'+shc[se.k]+'"/><text x="'+(sx+8)+'" y="'+(ly-2)+'" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold">'+se.k+'</text><text x="'+(sx+18)+'" y="'+ly+'" font-size="9" fill="#555">'+se.k+'：'+se.v+'</text>';
    });

    // 12宫
    for(var i=0;i<12;i++){
      var gi=pO.indexOf(i);if(gi<0)continue;
      var gx=mx+gp[gi].c*cw,gy=my+gp[gi].r*chH,p=ps[i];
      var fill=i===0?'#fef9ee':'#fdfaf5',stroke=i===0?'#c9a56a':'#d4c5a0',sw=i===0?'1.5':'0.8';
      svg+='<rect x="'+gx+'" y="'+gy+'" width="'+cw+'" height="'+chH+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
      svg+='<text x="'+(gx+cw/2)+'" y="'+(gy+16)+'" text-anchor="middle" font-family="KaiTi,serif" font-size="15" fill="#444" font-weight="bold">'+p.name+'</text>';
      svg+='<text x="'+(gx+10)+'" y="'+(gy+15)+'" font-size="11" fill="#c9a56a">'+p.zhi+'</text>';
      svg+='<text x="'+(gx+cw-8)+'" y="'+(gy+15)+'" text-anchor="end" font-size="10" fill="#aaa">'+(p.dx||0)+'~'+(p.dx+9)+'岁</text>';

      var cy=gy+36,lh=16;
      // 主星(红字+庙旺+四化)
      for(var ms=0;ms<p.ms.length;ms++){
        var e=p.ms[ms],star=self.stars[e.s];
        var hsh='';for(var k in{禄:0,权:1,科:2,忌:3}){if(sh[k]===star.name)hsh=k;}
        var bv=star.bright[e.b];if(bv===undefined)bv=2;
        var bm=self.brightMap[bv]||'—',sc=hsh?shc[hsh]:'#c03030';
        svg+=(hsh?'<circle cx="'+(gx+12)+'" cy="'+(cy-5)+'" r="5" fill="'+shc[hsh]+'"/><text x="'+(gx+12)+'" y="'+(cy-3)+'" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold">'+hsh+'</text>':'');
        var xoff=hsh?32:20;
        svg+='<text x="'+(gx+xoff)+'" y="'+cy+'" font-family="KaiTi,serif" font-size="14" fill="'+sc+'" font-weight="bold">'+star.name+'</text>';
        svg+='<text x="'+(gx+cw-10)+'" y="'+cy+'" text-anchor="end" font-size="10" fill="#aaa">'+bm+'</text>';
        cy+=lh;
      }
      // 辅星
      for(var ss2=0;ss2<p.ss.length;ss2++){
        var sd=self.subData[p.ss[ss2]];if(!sd)continue;
        svg+='<text x="'+(gx+6)+'" y="'+cy+'" font-size="11" fill="#666">'+sd.short+' '+sd.name+'</text>';cy+=14;
      }
      // 杂星(含天哭天虚红鸾天喜天姚咸池)
      var mt='';for(var mc=0;mc<p.xs.length;mc++){
        var xd=null;
        if(p.xs[mc]<=6)xd=self.subData[p.xs[mc]+7]; // 擎羊陀罗火星铃星空劫马
        else xd=self.subData[p.xs[mc]+7]; // 天哭天虚红鸾天喜天姚咸池
        if(xd)mt+=xd.short+' ';
      }
      if(mt)svg+='<text x="'+(gx+6)+'" y="'+cy+'" font-size="10" fill="#aaa">'+mt.trim()+'</text>';
    }
    svg+='</svg>';
    ctn.innerHTML=svg+'<button class="btn-secondary" onclick="ZiweiModule.close()">🔙 返回</button>';
    setTimeout(function(){ctn.scrollIntoView({behavior:'smooth',block:'start'});},200);
  }
};
