/**
 * 八字神煞查表层。
 * 只负责机械查表，不参与旺衰、格局、喜忌评分。
 * 口径：日干、年支、月支和特殊日柱分组，表项采用《三命通会》系常见起例。
 */
var BaziShenSha = (function() {
  'use strict';

  var POSITIONS = ['年柱','月柱','日柱','时柱'];
  var ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var STEM_TABLES = {
    天乙贵人:{甲:['丑','未'],乙:['子','申'],丙:['亥','酉'],丁:['亥','酉'],戊:['丑','未'],己:['子','申'],庚:['丑','未'],辛:['寅','午'],壬:['卯','巳'],癸:['卯','巳']},
    文昌贵人:{甲:'巳',乙:'午',丙:'申',丁:'酉',戊:'申',己:'酉',庚:'亥',辛:'子',壬:'寅',癸:'卯'},
    国印贵人:{甲:'戌',乙:'亥',丙:'丑',丁:'寅',戊:'丑',己:'寅',庚:'辰',辛:'巳',壬:'未',癸:'申'},
    福星贵人:{甲:'寅',乙:'丑',丙:'子',丁:'酉',戊:'申',己:'未',庚:'午',辛:'巳',壬:'辰',癸:'卯'},
    太极贵人:{甲:['子','午'],乙:['子','午'],丙:['酉','卯'],丁:['酉','卯'],戊:['辰','戌','丑','未'],己:['辰','戌','丑','未'],庚:['寅','亥'],辛:['寅','亥'],壬:['巳','申'],癸:['巳','申']},
    红艳:{甲:'午',乙:'午',丙:'寅',丁:'未',戊:'子',己:'辰',庚:'戌',辛:'酉',壬:'巳',癸:'申'},
    流霞:{甲:'酉',乙:'戌',丙:'未',丁:'申',戊:'巳',己:'午',庚:'辰',辛:'卯',壬:'亥',癸:'寅'},
    禄神:{甲:'寅',乙:'卯',丙:'巳',丁:'午',戊:'巳',己:'午',庚:'申',辛:'酉',壬:'亥',癸:'子'},
    金舆:{甲:'辰',乙:'巳',丙:'未',丁:'申',戊:'未',己:'申',庚:'戌',辛:'亥',壬:'丑',癸:'寅'},
    暗禄:{甲:'亥',乙:'戌',丙:'申',丁:'未',戊:'申',己:'未',庚:'巳',辛:'辰',壬:'寅',癸:'丑'},
    羊刃:{甲:'卯',丙:'午',戊:'午',庚:'酉',壬:'子'},
    飞刃:{甲:'酉',丙:'子',戊:'子',庚:'卯',壬:'午'}
  };
  var SAN_HE = {
    申:{桃花:'酉',驿马:'寅',华盖:'辰',将星:'子'},子:{桃花:'酉',驿马:'寅',华盖:'辰',将星:'子'},辰:{桃花:'酉',驿马:'寅',华盖:'辰',将星:'子'},
    寅:{桃花:'卯',驿马:'申',华盖:'戌',将星:'午'},午:{桃花:'卯',驿马:'申',华盖:'戌',将星:'午'},戌:{桃花:'卯',驿马:'申',华盖:'戌',将星:'午'},
    巳:{桃花:'午',驿马:'亥',华盖:'丑',将星:'酉'},酉:{桃花:'午',驿马:'亥',华盖:'丑',将星:'酉'},丑:{桃花:'午',驿马:'亥',华盖:'丑',将星:'酉'},
    亥:{桃花:'子',驿马:'巳',华盖:'未',将星:'卯'},卯:{桃花:'子',驿马:'巳',华盖:'未',将星:'卯'},未:{桃花:'子',驿马:'巳',华盖:'未',将星:'卯'}
  };
  var JZW = {
    申:{劫煞:'巳',灾煞:'午',亡神:'亥'},子:{劫煞:'巳',灾煞:'午',亡神:'亥'},辰:{劫煞:'巳',灾煞:'午',亡神:'亥'},
    寅:{劫煞:'亥',灾煞:'子',亡神:'巳'},午:{劫煞:'亥',灾煞:'子',亡神:'巳'},戌:{劫煞:'亥',灾煞:'子',亡神:'巳'},
    巳:{劫煞:'寅',灾煞:'卯',亡神:'申'},酉:{劫煞:'寅',灾煞:'卯',亡神:'申'},丑:{劫煞:'寅',灾煞:'卯',亡神:'申'},
    亥:{劫煞:'申',灾煞:'酉',亡神:'寅'},卯:{劫煞:'申',灾煞:'酉',亡神:'寅'},未:{劫煞:'申',灾煞:'酉',亡神:'寅'}
  };
  var HONG_LUAN={子:'卯',丑:'寅',寅:'丑',卯:'子',辰:'亥',巳:'戌',午:'酉',未:'申',申:'未',酉:'午',戌:'巳',亥:'辰'};
  var TIAN_XI={子:'酉',丑:'申',寅:'未',卯:'午',辰:'巳',巳:'辰',午:'卯',未:'寅',申:'丑',酉:'子',戌:'亥',亥:'戌'};
  var GU_GUA={亥:{孤辰:'寅',寡宿:'戌'},子:{孤辰:'寅',寡宿:'戌'},丑:{孤辰:'寅',寡宿:'戌'},寅:{孤辰:'巳',寡宿:'丑'},卯:{孤辰:'巳',寡宿:'丑'},辰:{孤辰:'巳',寡宿:'丑'},巳:{孤辰:'申',寡宿:'辰'},午:{孤辰:'申',寡宿:'辰'},未:{孤辰:'申',寡宿:'辰'},申:{孤辰:'亥',寡宿:'未'},酉:{孤辰:'亥',寡宿:'未'},戌:{孤辰:'亥',寡宿:'未'}};
  var TIAN_DE={寅:{gan:'丁'},卯:{zhi:'申'},辰:{gan:'壬'},巳:{gan:'辛'},午:{zhi:'亥'},未:{gan:'甲'},申:{gan:'癸'},酉:{zhi:'寅'},戌:{gan:'丙'},亥:{gan:'乙'},子:{zhi:'巳'},丑:{gan:'庚'}};
  var YUE_DE={寅:'丙',午:'丙',戌:'丙',申:'壬',子:'壬',辰:'壬',亥:'甲',卯:'甲',未:'甲',巳:'庚',酉:'庚',丑:'庚'};
  var GAN_HE={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
  var KUI_GANG=['庚辰','壬辰','戊戌','庚戌'];
  var YIN_CHA=['丙子','丁丑','戊寅','辛卯','壬辰','癸巳','丙午','丁未','戊申','辛酉','壬戌','癸亥'];
  var SHI_E=['甲辰','乙巳','丙申','丁亥','戊戌','己丑','庚辰','辛巳','壬申','癸亥'];
  var JIN_SHEN=['乙丑','己巳','癸酉'];
  var LIU_XIU=['丙午','丁未','戊子','戊午','己丑','己未'];

  function targets(v) { return Array.isArray(v) ? v : (v ? [v] : []); }
  function hit(list, name, position, basis) {
    if (!list.some(function(x){return x.name===name&&x.position===position;})) list.push({name:name,position:position,basis:basis});
  }
  function detect(dayStem, yearBranch, monthBranch, pillars) {
    pillars = pillars || [];
    var out=[];
    pillars.forEach(function(p,index){
      Object.keys(STEM_TABLES).forEach(function(name){
        if (targets(STEM_TABLES[name][dayStem]).indexOf(p.zhi)>=0) hit(out,name,POSITIONS[index],'日干'+dayStem+'见'+p.zhi);
      });
      var san=SAN_HE[yearBranch]||{};
      Object.keys(san).forEach(function(name){if(san[name]===p.zhi)hit(out,name,POSITIONS[index],'年支'+yearBranch+'三合局查'+p.zhi);});
      var jzw=JZW[yearBranch]||{};
      Object.keys(jzw).forEach(function(name){if(jzw[name]===p.zhi)hit(out,name,POSITIONS[index],'年支'+yearBranch+'查'+p.zhi);});
      if(HONG_LUAN[yearBranch]===p.zhi)hit(out,'红鸾',POSITIONS[index],'年支'+yearBranch+'查'+p.zhi);
      if(TIAN_XI[yearBranch]===p.zhi)hit(out,'天喜',POSITIONS[index],'年支'+yearBranch+'查'+p.zhi);
      var gg=GU_GUA[yearBranch]||{};
      Object.keys(gg).forEach(function(name){if(gg[name]===p.zhi)hit(out,name,POSITIONS[index],'年支'+yearBranch+'查'+p.zhi);});
      var td=TIAN_DE[monthBranch]||{};
      if((td.gan&&td.gan===p.gan)||(td.zhi&&td.zhi===p.zhi))hit(out,'天德贵人',POSITIONS[index],'月支'+monthBranch+'查'+(td.gan||td.zhi));
      if(YUE_DE[monthBranch]===p.gan)hit(out,'月德贵人',POSITIONS[index],'月支'+monthBranch+'查'+p.gan);
      if(GAN_HE[YUE_DE[monthBranch]]===p.gan)hit(out,'月德合',POSITIONS[index],'月德天干五合');
      if(ZHI[(ZHI.indexOf(monthBranch)+11)%12]===p.zhi)hit(out,'天医',POSITIONS[index],'月支退一位见'+p.zhi);
    });
    var day=(pillars[2]||{}).gan+((pillars[2]||{}).zhi||'');
    [[KUI_GANG,'魁罡'],[YIN_CHA,'阴差阳错'],[SHI_E,'十恶大败'],[JIN_SHEN,'金神'],[LIU_XIU,'六秀日']].forEach(function(row){if(row[0].indexOf(day)>=0)hit(out,row[1],'日柱','日柱'+day+'入表');});
    return out;
  }

  return {detect:detect, tables:STEM_TABLES, sanHe:SAN_HE, transit:function(r,pillar,label){
    var out=[];
    Object.keys(STEM_TABLES).forEach(function(name){if(targets(STEM_TABLES[name][r.dayMaster]).indexOf(pillar.zhi)>=0)hit(out,name,label,'日干'+r.dayMaster+'见'+pillar.zhi);});
    var san=SAN_HE[r.yearP.zhi]||{}, jzw=JZW[r.yearP.zhi]||{};
    Object.keys(san).forEach(function(name){if(san[name]===pillar.zhi)hit(out,name,label,'年支'+r.yearP.zhi+'查'+pillar.zhi);});
    Object.keys(jzw).forEach(function(name){if(jzw[name]===pillar.zhi)hit(out,name,label,'年支'+r.yearP.zhi+'查'+pillar.zhi);});
    if(HONG_LUAN[r.yearP.zhi]===pillar.zhi)hit(out,'红鸾',label,'年支查');
    if(TIAN_XI[r.yearP.zhi]===pillar.zhi)hit(out,'天喜',label,'年支查');
    return out;
  }};
})();
