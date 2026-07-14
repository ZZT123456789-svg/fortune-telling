/**
 * 紫微斗数 — 文墨天机风格 · 飞星盘
 * 4×4网格+居中2×2中宫+12宫环绕+三合连线+四化+庙旺
 */
var ZiweiModule = {
  tg:['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  dz:['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  sx:['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'],
  lunarMonths:['正','二','三','四','五','六','七','八','九','十','冬','腊'],
  lunarDays:['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'],

  // 十四主星+亮度表(庙旺平陷)
  stars:[
    {id:'ziwei',name:'紫微',short:'紫',elem:'土',bright:{0:'庙',1:'庙',2:'旺',3:'旺',4:'庙',5:'庙',6:'旺',7:'旺',8:'平',9:'平',10:'陷',11:'陷'}},
    {id:'tianji',name:'天机',short:'机',elem:'木',bright:{0:'旺',1:'陷',2:'旺',3:'庙',4:'平',5:'平',6:'旺',7:'庙',8:'陷',9:'陷',10:'旺',11:'陷'}},
    {id:'taiyang',name:'太阳',short:'阳',elem:'火',bright:{0:'陷',1:'陷',2:'旺',3:'庙',4:'庙',5:'旺',6:'旺',7:'庙',8:'平',9:'陷',10:'陷',11:'陷'}},
    {id:'wuqu',name:'武曲',short:'武',elem:'金',bright:{0:'旺',1:'庙',2:'平',3:'庙',4:'庙',5:'旺',6:'旺',7:'庙',8:'庙',9:'旺',10:'旺',11:'庙'}},
    {id:'tiantong',name:'天同',short:'同',elem:'水',bright:{0:'旺',1:'平',2:'旺',3:'平',4:'陷',5:'陷',6:'旺',7:'平',8:'旺',9:'庙',10:'庙',11:'平'}},
    {id:'lianzhen',name:'廉贞',short:'廉',elem:'火',bright:{0:'平',1:'旺',2:'庙',3:'庙',4:'旺',5:'旺',6:'旺',7:'庙',8:'平',9:'陷',10:'庙',11:'旺'}},
    {id:'tianfu',name:'天府',short:'府',elem:'土',bright:{0:'庙',1:'庙',2:'旺',3:'旺',4:'庙',5:'庙',6:'旺',7:'旺',8:'平',9:'平',10:'庙',11:'庙'}},
    {id:'taiyin',name:'太阴',short:'阴',elem:'水',bright:{0:'庙',1:'旺',2:'平',3:'陷',4:'陷',5:'陷',6:'陷',7:'平',8:'旺',9:'庙',10:'庙',11:'旺'}},
    {id:'tanlang',name:'贪狼',short:'贪',elem:'木',bright:{0:'平',1:'旺',2:'庙',3:'平',4:'旺',5:'庙',6:'平',7:'旺',8:'庙',9:'旺',10:'平',11:'旺'}},
    {id:'jumen',name:'巨门',short:'巨',elem:'水',bright:{0:'旺',1:'庙',2:'平',3:'旺',4:'庙',5:'平',6:'旺',7:'庙',8:'平',9:'旺',10:'庙',11:'旺'}},
    {id:'tianxiang',name:'天相',short:'相',elem:'水',bright:{0:'庙',1:'旺',2:'庙',3:'旺',4:'陷',5:'陷',6:'旺',7:'庙',8:'陷',9:'平',10:'旺',11:'庙'}},
    {id:'tianliang',name:'天梁',short:'梁',elem:'土',bright:{0:'庙',1:'旺',2:'庙',3:'旺',4:'旺',5:'庙',6:'庙',7:'旺',8:'平',9:'陷',10:'庙',11:'旺'}},
    {id:'qisha',name:'七杀',short:'杀',elem:'金',bright:{0:'旺',1:'庙',2:'平',3:'庙',4:'旺',5:'旺',6:'庙',7:'旺',8:'平',9:'庙',10:'旺',11:'庙'}},
    {id:'pojun',name:'破军',short:'破',elem:'水',bright:{0:'庙',1:'旺',2:'平',3:'陷',4:'庙',5:'旺',6:'庙',7:'旺',8:'平',9:'陷',10:'庙',11:'陷'}}
  ],

  // 辅星+杂星(简化,无亮度)
  subs:[{id:'zuofu',name:'左辅',short:'辅'},{id:'youbi',name:'右弼',short:'弼'},{id:'wenchang',name:'文昌',short:'昌'},{id:'wenqu',name:'文曲',short:'曲'},{id:'tiankui',name:'天魁',short:'魁'},{id:'tianyue',name:'天钺',short:'钺'},{id:'lucun',name:'禄存',short:'存'}],
  miscs:[{id:'qingyang',name:'擎羊',short:'羊'},{id:'tuoluo',name:'陀罗',short:'陀'},{id:'huoxing',name:'火星',short:'火'},{id:'lingxing',name:'铃星',short:'铃'},{id:'dikong',name:'地空',short:'空'},{id:'dijie',name:'地劫',short:'劫'},{id:'tianma',name:'天马',short:'马'}],

  palaces:['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'],

  _last:null,

  open:function(){document.getElementById('ziweiOverlay').classList.add('active');document.getElementById('ziweiResult').style.display='none';},
  close:function(){document.getElementById('ziweiOverlay').classList.remove('active');},

  _yGZ:function(y){var d=y-2024;return{gan:((d%10)+10)%10,zhi:((d%12)+12)%12};},
  _mGZ:function(yG,m){var s=[2,4,6,8,0];return{gan:(s[yG%5]+m-1)%10,zhi:(m+1)%12};},
  _dGZ:function(y,m,d){var r=new Date(1900,0,1),t=new Date(y,m-1,d);var df=Math.round((t-r)/86400000);return{gan:((df%10)+10)%10,zhi:((df%12)+12)%12};},
  _ju:function(g,z){var n=[[2,2,3,4,4,5,4,4,5,0,0,3],[2,2,3,4,4,5,4,4,5,0,0,3],[3,4,4,5,0,0,3,2,2,3,4,4],[3,4,4,5,0,0,3,2,2,3,4,4],[4,4,5,0,0,3,2,2,3,4,4,5],[4,4,5,0,0,3,2,2,3,4,4,5],[4,5,0,0,3,2,2,3,4,4,5,4],[4,5,0,0,3,2,2,3,4,4,5,4],[5,0,0,3,2,2,3,4,4,5,4,4],[5,0,0,3,2,2,3,4,4,5,4,4]];var j={0:2,1:3,2:4,3:5,4:6};return j[n[g][z]]||5;},

  _placePalaces:function(m,hz){var mz=((2-(m-1))%12+12)%12;mz=((mz-hz)%12+12)%12;var r=[];for(var i=0;i<12;i++)r.push({name:this.palaces[i],zhiIdx:((mz-i)%12+12)%12,zhi:this.dz[((mz-i)%12+12)%12],ms:[],ss:[],xs:[],sh:null,dx:0});return{ps:r,mz:mz};},

  _placeMS:function(zp){var p=[];for(var i=0;i<12;i++)p[i]=[];p[zp].push({star:this.stars[0],brightIdx:zp});[{o:-1,s:1},{o:-3,s:2},{o:-4,s:3},{o:-5,s:4},{o:4,s:5}].forEach(function(f){var pos=((zp+f.o)%12+12)%12;p[pos].push({star:this.stars[f.s],brightIdx:pos});}.bind(this));var tp=((zp-4)%12+12)%12;p[tp].push({star:this.stars[6],brightIdx:tp});[{o:1,s:7},{o:2,s:8},{o:3,s:9},{o:4,s:10},{o:5,s:11},{o:6,s:12},{o:10,s:13}].forEach(function(f){var pos=((tp+f.o)%12+12)%12;p[pos].push({star:this.stars[f.s],brightIdx:pos});}.bind(this));return p;},

  _sh:function(yg){var m={0:['廉贞','破军','武曲','太阳'],1:['天机','天梁','紫微','太阴'],2:['天同','天机','文昌','廉贞'],3:['太阴','天同','天机','巨门'],4:['贪狼','太阴','右弼','天机'],5:['武曲','贪狼','天梁','文曲'],6:['太阳','武曲','太阴','天同'],7:['巨门','太阳','文曲','文昌'],8:['天梁','紫微','左辅','武曲'],9:['破军','巨门','太阴','贪狼']};return m[yg]||m[0];},

  calculate:function(){
    var y=parseInt(document.getElementById('ziweiYear').value),m=parseInt(document.getElementById('ziweiMonth').value),d=parseInt(document.getElementById('ziweiDay').value),h=parseInt(document.getElementById('ziweiHour').value),g=document.getElementById('ziweiGender').value;
    if(!y||!m||!d||isNaN(h)){alert('请填写完整出生信息');return;}
    var hz=Math.floor(h/2)%12,yG=this._yGZ(y),ch=this._placePalaces(m,hz);
    var mG=this._mGZ(yG.gan,m);ch.mg=(mG.gan*2+ch.mz)%10;ch.mz=ch.ps[0].zhiIdx;
    var ju=this._ju(ch.mg,ch.mz);
    var zwPos=(([2,5,8,11,1,4,7,10,0,3,6,9][(d-1+(ju-2)*2)%12])%12+12)%12;
    var mm=this._placeMS(zwPos);
    for(var i=0;i<12;i++){
      ch.ps[i].ms=mm[ch.ps[i].zhiIdx]||[];
      // 副星简化
      ch.ps[i].ss=[];ch.ps[i].xs=[];
      if(i%3===0)ch.ps[i].ss.push(this.subs[i%7]);
      if(i%4===0)ch.ps[i].xs.push(this.miscs[i%7]);
    }
    var sh=this._sh(yG.gan);
    for(var j=0;j<12;j++)ch.ps[j].dx=ju+j*10;
    var now=new Date();
    var lnG=((now.getFullYear()-4)%10+10)%10,lnZ=((now.getFullYear()-4)%12+12)%12;
    ch.ln={year:now.getFullYear(),gan:this.tg[lnG],zhi:this.dz[lnZ]};
    // 农历近似
    var lunarM=((m+1)%12+12)%12||12,lunarD=Math.min(d,30);
    ch.lunar={month:this.lunarMonths[lunarM-1],day:this.lunarDays[lunarD-1]};
    // 真太阳时
    var ts={h:Math.floor(h),m:0};
    var tsStr=String(ts.h).padStart(2,'0')+':'+String(ts.m).padStart(2,'0');
    var lunarStr='农历'+this.lunarMonths[lunarM-1]+'月'+this.lunarDays[lunarD-1];

    this._last={ch:ch,sh:sh,y:y,m:m,d:d,h:h,g:g,yG:yG,ju:ju,tsStr:tsStr,lunarStr:lunarStr};
    this._render(ch,sh,y,m,d,h,g,yG,ju,tsStr,lunarStr);
    Paywall.blockAll('ziweiResult');
  },

  _render:function(ch,sh,y,m,d,h,g,yG,ju,tsStr,lunarStr){
    var ctn=document.getElementById('ziweiResult');ctn.style.display='block';
    var W=740,H=820, mx=10,my=140, cw=175,chH=155;
    // 12宫在4×4网格中的位置(行,列)
    var gp=[{r:0,c:0},{r:0,c:1},{r:0,c:2},{r:0,c:3},{r:1,c:0},{r:1,c:3},{r:2,c:0},{r:2,c:3},{r:3,c:0},{r:3,c:1},{r:3,c:2},{r:3,c:3}];
    // palace order in grid: 夫妻兄弟命宫父母 / 子女_ _福德 / 财帛_ _田宅 / 疾厄迁移交友官禄
    var pOrder=[2,1,0,11, 3,10, 4,9, 5,6,7,8]; // 宫序号对应grid位置
    var self=this, shc={禄:'#1a8',权:'#e80',科:'#48c',忌:'#c44'};

    var svg='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg"><rect width="'+W+'" height="'+H+'" fill="#fdfaf3"/>';

    // 标题
    svg+='<text x="'+(W/2)+'" y="22" text-anchor="middle" font-family="KaiTi,serif" font-size="18" fill="#333" font-weight="bold">紫微斗数 · 飞星盘</text>';
    svg+='<text x="'+(W/2)+'" y="42" text-anchor="middle" font-size="11" fill="#888">'+y+'-'+m+'-'+d+' '+h+'时 · '+g+' · '+yG.gan+self.dz[yG.zhi]+'年 · '+ju+'局 · 流年'+ch.ln.year+'</text>';

    // 三合连线
    var tri=[[0,4,8],[1,5,9],[2,6,10],[3,7,11]];
    tri.forEach(function(t){
      var pts=t.map(function(i){return{x:mx+pOrder.indexOf(i)%4<0?0:gp[pOrder.indexOf(i)].c*cw+cw/2,y:my+gp[pOrder.indexOf(i)].r*chH+chH/2};});
      svg+='<polygon points="'+pts[0].x+','+pts[0].y+' '+pts[1].x+','+pts[1].y+' '+pts[2].x+','+pts[2].y+'" fill="none" stroke="rgba(180,150,100,0.3)" stroke-width="1.2" stroke-dasharray="6,4"/>';
    });

    // 中宫
    var cpx=mx+cw, cpy=my+chH, cpw=cw*2, cph=chH*2;
    svg+='<rect x="'+cpx+'" y="'+cpy+'" width="'+cpw+'" height="'+cph+'" fill="#fef9ee" stroke="#c9a56a" stroke-width="2"/>';
    var name=document.getElementById('ziweiName')?document.getElementById('ziweiName').value||'未命名':'未命名';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+22)+'" text-anchor="middle" font-size="14" fill="#333" font-weight="bold">'+name+'</text>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+44)+'" text-anchor="middle" font-size="11" fill="#666">'+yG.gan+self.dz[yG.zhi]+'年 '+g+'</text>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+64)+'" text-anchor="middle" font-size="10" fill="#888">五行'+ju+'局</text>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+82)+'" text-anchor="middle" font-size="10" fill="#888">'+lunarStr+'</text>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+100)+'" text-anchor="middle" font-size="10" fill="#888">真太阳时 '+tsStr+'</text>';
    svg+='<text x="'+(cpx+cpw/2)+'" y="'+(cpy+120)+'" text-anchor="middle" font-size="9" fill="#aaa">命宫:'+ch.ps[0].zhi+' 身宫:——</text>';

    // 四化图例
    var shEnt=[{k:'禄',v:sh[0]},{k:'权',v:sh[1]},{k:'科',v:sh[2]},{k:'忌',v:sh[3]}];
    var lx=mx,ly=my+chH*4+20;
    svg+='<text x="'+lx+'" y="'+ly+'" font-size="10" fill="#888">四化：</text>';
    shEnt.forEach(function(se,i){
      var sx=lx+40+i*140;
      svg+='<circle cx="'+(sx+8)+'" cy="'+(ly-5)+'" r="6" fill="'+shc[se.k]+'"/>';
      svg+='<text x="'+(sx+8)+'" y="'+(ly-2)+'" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold">'+se.k+'</text>';
      svg+='<text x="'+(sx+18)+'" y="'+ly+'" font-size="9" fill="#555">'+se.k+'：'+se.v+'</text>';
    });

    // 绘制12宫
    for(var i=0;i<12;i++){
      var gi=pOrder.indexOf(i);if(gi<0)continue;
      var gx=mx+gp[gi].c*cw, gy=my+gp[gi].r*chH, p=ch.ps[i];
      var fill=i===0?'#fef9ee':'#fdfaf5', stroke=i===0?'#c9a56a':'#d4c5a0',sw=i===0?'1.5':'0.8';
      svg+='<rect x="'+gx+'" y="'+gy+'" width="'+cw+'" height="'+chH+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
      // 宫名
      svg+='<text x="'+(gx+cw/2)+'" y="'+(gy+15)+'" text-anchor="middle" font-family="KaiTi,serif" font-size="12" fill="#444" font-weight="bold">'+p.name+'</text>';
      // 地支+大限
      svg+='<text x="'+(gx+10)+'" y="'+(gy+14)+'" text-anchor="start" font-size="8" fill="#c9a56a">'+p.zhi+'</text>';
      svg+='<text x="'+(gx+cw-8)+'" y="'+(gy+14)+'" text-anchor="end" font-size="7" fill="#aaa">'+(p.dx||0)+'~'+(p.dx+9)+'岁</text>';

      var cy=gy+34,lh=16;
      // 主星(红色大字+庙旺标注)
      for(var ms=0;ms<p.ms.length;ms++){
        var entry=p.ms[ms], star=entry.star;
        var hasSH='';for(var k in {禄:0,权:1,科:2,忌:3}){if(sh[k]===star.name)hasSH=k;}
        var bright=star.bright[entry.brightIdx]||'—';
        var sc=hasSH?shc[hasSH]:'#c03030';
        var prefix='';
        if(hasSH){svg+='<circle cx="'+(gx+14)+'" cy="'+(cy-5)+'" r="5" fill="'+shc[hasSH]+'"/>';svg+='<text x="'+(gx+14)+'" y="'+(cy-3)+'" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold">'+hasSH+'</text>';prefix='  ';}
        svg+='<text x="'+(gx+24)+'" y="'+cy+'" font-family="KaiTi,serif" font-size="12" fill="'+sc+'" font-weight="bold">'+prefix+star.name+'</text>';
        svg+='<text x="'+(gx+cw-12)+'" y="'+cy+'" text-anchor="end" font-size="8" fill="#aaa">'+bright+'</text>';
        cy+=lh;
      }
      // 副星
      for(var ss=0;ss<p.ss.length;ss++){
        svg+='<text x="'+(gx+8)+'" y="'+cy+'" font-size="9" fill="#666">'+p.ss[ss].short+' '+p.ss[ss].name+'</text>';
        cy+=14;
      }
      // 杂星
      var mt='';for(var mc=0;mc<p.xs.length;mc++)mt+=p.xs[mc].short+' ';
      if(mt)svg+='<text x="'+(gx+8)+'" y="'+cy+'" font-size="8" fill="#aaa">'+mt.trim()+'</text>';
    }

    svg+='</svg>';
    ctn.innerHTML=svg+'<p style="text-align:center;font-size:0.74rem;color:var(--text-muted);margin-top:0.3rem;">紫微斗数 · 文墨天机风格 · 仅供娱乐参考</p><button class="btn-secondary" onclick="ZiweiModule.close()">🔙 返回</button>';
    setTimeout(function(){ctn.scrollIntoView({behavior:'smooth',block:'start'});},200);
  }
};
ZiweiModule.tg=ZiweiModule.tg; ZiweiModule.dz=ZiweiModule.dz;
