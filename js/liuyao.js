/**
 * 六爻纳甲 — 装卦·世应·六亲·六神·用神·月建日辰·动变
 */
var LiuyaoModule = {
  currentRound:0,yaoLines:[],shuffledDeck:[],

  open:function(){document.getElementById('liuyaoOverlay').classList.add('active');this._reset();},
  close:function(){document.getElementById('liuyaoOverlay').classList.remove('active');this._reset();},

  _reset:function(){
    this.currentRound=0;this.yaoLines=[];
    document.getElementById('liuyaoStart').style.display='block';
    document.getElementById('liuyaoShaking').style.display='none';
    document.getElementById('liuyaoResult').style.display='none';
    document.getElementById('yaoDisplay').innerHTML='';
    document.getElementById('coinResultText').textContent='';
    for(var c=1;c<=3;c++){var el=document.getElementById('coin'+c);if(el){el.textContent='🪙';el.className='coin-img';}}
  },

  start:function(){
    document.getElementById('liuyaoStart').style.display='none';
    document.getElementById('liuyaoShaking').style.display='block';
    document.getElementById('liuyaoResult').style.display='none';
    this.currentRound=0;this.yaoLines=[];
    document.getElementById('yaoDisplay').innerHTML='';
    document.getElementById('coinResultText').textContent='';
    this._updateRound();
  },

  _updateRound:function(){document.getElementById('liuyaoRound').textContent=this.currentRound+1;document.getElementById('liuyaoRoundBtn').textContent=this.currentRound+1;},

  shake:function(){
    var self=this;
    for(var c=1;c<=3;c++){var el=document.getElementById('coin'+c);if(el)el.classList.add('shaking');}
    document.getElementById('coinResultText').textContent='🪙 铜钱翻滚中...';
    setTimeout(function(){
      for(var c=1;c<=3;c++){var el=document.getElementById('coin'+c);if(el)el.classList.remove('shaking');}
      self._doShake();
    },800);
  },

  _doShake:function(){
    var coins=[Math.random()<0.5?3:2,Math.random()<0.5?3:2,Math.random()<0.5?3:2];
    for(var c=1;c<=3;c++){var el=document.getElementById('coin'+c);if(el){var h=coins[c-1]===3;el.textContent=h?'🟡':'⚪';el.className='coin-img '+(h?'heads':'tails');}}
    var sum=coins[0]+coins[1]+coins[2];
    var hc=coins.filter(function(x){return x===3;}).length;
    document.getElementById('coinResultText').textContent='正面×'+hc+' 反面×'+(3-hc)+' 合计:'+sum;
    var type,disp; if(sum===6){type='old_yin';disp='⚋ ╳ 老阴';}else if(sum===7){type='young_yang';disp='⚊ 少阳';}else if(sum===8){type='young_yin';disp='⚋ 少阴';}else{type='old_yang';disp='⚊ ○ 老阳';}
    this.yaoLines.push({type:type,display:disp,sum:sum,coins:coins.slice()});this.currentRound++;
    var h='';for(var i=this.yaoLines.length-1;i>=0;i--){h+='<div class="yao-line">第'+(i+1)+'爻：'+this.yaoLines[i].display+'</div>';}
    document.getElementById('yaoDisplay').innerHTML=h;
    if(this.currentRound>=6){this._showResult();Paywall.blockAll('liuyaoResult');}else{this._updateRound();}
  },

  _showResult:function(){
    document.getElementById('liuyaoShaking').style.display='none';
    var tg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    // 构建本卦key(6位二进制从上到下)
    var key='';for(var k=5;k>=0;k--){var l=this.yaoLines[k];key+=(l.type==='young_yang'||l.type==='old_yang')?'1':'0';}
    var cl=[];for(var j=0;j<6;j++){if(this.yaoLines[j].type==='old_yin'||this.yaoLines[j].type==='old_yang')cl.push(j+1);}
    // 变卦key
    var bKey='';for(var k2=5;k2>=0;k2--){var l2=this.yaoLines[k2];var y=(l2.type==='young_yang'||l2.type==='old_yang');if(l2.type==='old_yin')y=true;if(l2.type==='old_yang')y=false;bKey+=y?'1':'0';}

    // 当前日辰月建
    var now=new Date();
    var dGZ=BaziDB.getDayPillar(now.getFullYear(),now.getMonth()+1,now.getDate());
    var yg0=((now.getFullYear()-4)%10+10)%10;
    var bm=BaziDB.getBaziMonth(now.getFullYear(),now.getMonth()+1,now.getDate(),now.getHours());
    var ms=[2,4,6,8,0];var mg=(ms[yg0%5]+bm)%10,mz=(2+bm)%12;
    var monthZhi=dz[mz];

    var najia=LiuYaoDB.getNaJia(key,dGZ.gan,monthZhi,dGZ.zhi);
    var najiaB=LiuYaoDB.getNaJia(bKey,dGZ.gan,monthZhi,dGZ.zhi);
    if(!najia){document.getElementById('liuyaoResult').innerHTML='<p>卦数据缺失</p>';return;}

    // 用神
    var q=document.getElementById('liuyaoQuestion').value||'';
    var ys='妻财';if(/感情|恋爱|婚姻/.test(q))ys='官鬼';else if(/工作|事业|升职/.test(q))ys='官鬼';else if(/考试|学业/.test(q))ys='父母';else if(/健康|身体/.test(q))ys='子孙';
    var ysYao=najia.lines.filter(function(l){return l.liuQin===ys;})[0]||najia.lines[0];
    var shiYao=najia.lines.filter(function(l){return l.role==='世';})[0];

    var h='<div class="result-header">🪙 六爻纳甲 — '+najia.name+'</div>';
    h+='<div style="text-align:center;padding:0.2rem;color:var(--text-secondary);font-size:0.85rem;">'+najia.palace+'宫·属'+najia.palaceElem+' | 日辰 '+dGZ.gan+dGZ.zhi+' | 月建 '+monthZhi+'</div>';
    h+='<p style="text-align:center;font-size:0.85rem;color:var(--gold);">'+(q||'综合问事')+' → 用神:<b>'+ys+'</b></p>';

    // 纳甲表
    h+='<table style="width:100%;border-collapse:collapse;font-size:0.82rem;"><tr style="background:rgba(201,169,110,0.1);"><th>爻</th><th>地支</th><th>五行</th><th>六亲</th><th>六神</th><th>世应</th><th>月建</th></tr>';
    for(var y=5;y>=0;y--){
      var nl=najia.lines[y],cg=cl.indexOf(y+1)>=0;
      var bg=nl.role==='世'?'rgba(201,169,110,0.15)':(nl.role==='应'?'rgba(180,180,180,0.06)':'');
      var lb=['初','二','三','四','五','上'][y];
      h+='<tr style="background:'+bg+';">';
      h+='<td style="padding:3px 5px;text-align:center;">'+(cg?'<b style="color:var(--red);">⚡</b>':'')+lb+'</td>';
      h+='<td style="padding:3px 5px;text-align:center;">'+nl.zhi+'</td>';
      h+='<td style="padding:3px 5px;text-align:center;">'+nl.zhiElem+'</td>';
      h+='<td style="padding:3px 5px;text-align:center;font-weight:'+(nl.liuQin===ys?'bold':'normal')+';color:'+(nl.liuQin===ys?'var(--gold)':'var(--text)')+';">'+nl.liuQin+(nl.liuQin===ys?' ★':'')+'</td>';
      h+='<td style="padding:3px 5px;text-align:center;font-size:0.78rem;">'+nl.liuShou+'</td>';
      h+='<td style="padding:3px 5px;text-align:center;font-weight:bold;color:'+(nl.role==='世'?'var(--gold)':'var(--text-secondary)')+';">'+(nl.role||'')+'</td>';
      h+='<td style="padding:3px 5px;text-align:center;font-size:0.76rem;">'+(nl.monthEffect||'—')+'</td></tr>';
      if(cg&&najiaB){
        var bl=najiaB.lines[y];
        h+='<tr style="font-size:0.76rem;background:rgba(200,80,80,0.04);"><td>→变</td><td>'+bl.zhi+'</td><td>'+bl.zhiElem+'</td><td>'+bl.liuQin+'</td><td colspan="3" style="color:var(--red);">老'+(this.yaoLines[y].type==='old_yang'?'阳':'阴')+'变</td></tr>';
      }
    }
    h+='</table>';

    // 变卦信息
    if(cl.length>0&&najiaB)h+='<div style="text-align:center;padding:0.4rem;font-size:0.9rem;"><b>变卦：'+najiaB.name+'</b>（'+najiaB.palace+'宫·属'+najiaB.palaceElem+'）</div>';

    // 断卦
    h+='<div class="analysis-card"><h4>🎯 用神分析（'+ys+'）</h4><p>';
    if(ysYao.monthEffect.indexOf('旺')>=0)h+='用神临月建旺相，'+ys+'有力，所问之事根基稳固，宜积极行动。';
    else if(ysYao.monthEffect.indexOf('囚')>=0)h+='用神被月建克制偏弱，当前不是最佳时机，建议等待或调整策略。';
    else h+='用神气数平和，需自身努力推动，不可完全依赖外力。';
    if(ysYao.role==='世')h+=' 用神持世，主动权在你手中。';
    if(ysYao.role==='应')h+=' 用神在应爻，事在对方/外部环境，需多关注外界。';
    h+='</p></div>';

    h+='<div class="analysis-card"><h4>👤 世爻（自身状态）</h4><p>';
    h+='世爻'+shiYao.zhi+'（'+shiYao.zhiElem+'），六亲为<b>'+shiYao.liuQin+'</b>，临<b>'+shiYao.liuShou+'</b>。';
    if(shiYao.monthEffect.indexOf('旺')>=0)h+=' 世爻得月建，气势较旺，行事果断。';
    else if(shiYao.monthEffect.indexOf('囚')>=0)h+=' 世爻被克偏弱，宜借力行事不宜强求。';
    else h+=' 世爻平稳，按部就班即可。';
    h+='</p></div>';

    h+='<p style="font-size:0.72rem;color:var(--text-muted);text-align:center;">六爻纳甲排盘·仅供娱乐参考</p>';
    h+='<button class="btn-secondary" onclick="LiuyaoModule.start()">🪙 重新摇卦</button>';
    h+='<button class="btn-secondary" onclick="LiuyaoModule.close()">🔙 返回</button>';
    document.getElementById('liuyaoResult').innerHTML=h;
  }
};
