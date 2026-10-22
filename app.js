'use strict';
const $=id=>document.getElementById(id),blue='#205d80',terra='#b75d41',gray='#c7d0cf';
let results,method='hj',stepIndex=0,timer=null;
const num=(v,n=6)=>Number.isFinite(v)?v.toLocaleString('ru-RU',{maximumFractionDigits:n}):String(v);
function frame(id,xmin,xmax,ymin,ymax,xlabel,ylabel){
 const canvas=$(id),dpr=window.devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
 canvas.width=w*dpr;canvas.height=h*dpr;const c=canvas.getContext('2d');c.scale(dpr,dpr);
 const l=64,r=20,t=24,b=45,pw=w-l-r,ph=h-t-b;
 if(xmax===xmin)xmax=xmin+1;if(ymax===ymin)ymax=ymin+1;
 const X=x=>l+(x-xmin)/(xmax-xmin)*pw,Y=y=>t+ph-(y-ymin)/(ymax-ymin)*ph;
 c.font='11px Helvetica';c.lineWidth=1;
 for(let i=0;i<=4;i++){let xx=xmin+(xmax-xmin)*i/4,yy=ymin+(ymax-ymin)*i/4;
  c.strokeStyle='#e8ebe6';c.beginPath();c.moveTo(X(xx),t);c.lineTo(X(xx),t+ph);c.stroke();c.beginPath();c.moveTo(l,Y(yy));c.lineTo(l+pw,Y(yy));c.stroke();
  c.fillStyle='#657079';c.textAlign='center';c.fillText(num(xx,1),X(xx),h-24);c.textAlign='right';c.fillText(num(yy,1),l-9,Y(yy)+4);
 }
 c.fillStyle='#222c32';c.textAlign='right';c.fillText(xlabel,w-r,h-5);c.textAlign='left';c.fillText(ylabel,5,13);
 const line=(pts,color,width=2,dash=[])=>{c.save();c.beginPath();c.rect(l,t,pw,ph);c.clip();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();pts.forEach((p,i)=>i?c.lineTo(X(p[0]),Y(p[1])):c.moveTo(X(p[0]),Y(p[1])));c.stroke();c.restore();};
 const dot=(x,y,color,size=4)=>{c.fillStyle=color;c.beginPath();c.arc(X(x),Y(y),size,0,Math.PI*2);c.fill();};
 return {c,X,Y,line,dot,xmin,xmax,ymin,ymax};
}
function contour(f){
 const {xmin,xmax,ymin,ymax,line}=f,nx=65,ny=48;
 const val=(x,y)=>Lab.objective([x,y]);
 const levels=[-100,-80,-60,-40,-20,0,10,25,50,100,250,500];
 for(const z of levels){
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
   const x=xmin+(xmax-xmin)*i/nx,y=ymin+(ymax-ymin)*j/ny,dx=(xmax-xmin)/nx,dy=(ymax-ymin)/ny;
   const p=[[x,y],[x+dx,y],[x+dx,y+dy],[x,y+dy]],v=p.map(q=>val(...q)),cross=[];
   for(let k=0;k<4;k++){const m=(k+1)%4;if((v[k]<z)!==(v[m]<z)){const q=(z-v[k])/(v[m]-v[k]);cross.push([p[k][0]+q*(p[m][0]-p[k][0]),p[k][1]+q*(p[m][1]-p[k][1])]);}}
   if(cross.length===2)line(cross,'#c7d3cd',1);
  }
 }
 f.c.fillStyle='#7a8981';f.c.font='10px Helvetica';f.c.fillText('Линии уровня f(x₁, x₂)',73,20);
}
function series(){const r=results[method];return method==='hj'?r.path:r.evaluations;}
function stop(){if(timer)clearInterval(timer);timer=null;$('play').textContent='▶';$('play').setAttribute('aria-label','Воспроизвести шаги');}
function draw(){
 if(!results)return;const r=results[method],s=series(),pts=s.slice(0,stepIndex+1),p=s[stepIndex];
 let xs=s.map(p=>p.x),ys=s.map(p=>p.y),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
 const padx=Math.max(2,(xmax-xmin)*.08),pady=Math.max(2,(ymax-ymin)*.13);
 const f=frame('trajectory',xmin-padx,xmax+padx,ymin-pady,ymax+pady,'x₁','x₂');
 contour(f);f.line(pts.map(p=>[p.x,p.y]),method==='hj'?blue:terra,2.2,method==='gs'?[6,4]:[]);
 if(method==='gs'){results.gs.evaluations.slice(0,stepIndex+1).forEach(p=>f.dot(p.x,p.y,terra,2));f.dot(r.point[0],r.point[1],blue,4);}else if(pts.length<45)pts.forEach(p=>f.dot(p.x,p.y,blue,2));
 f.dot(s[0].x,s[0].y,'#222c32',4);f.dot(p.x,p.y,method==='hj'?blue:terra,5);
 $('step-label').textContent=`${stepIndex} / ${s.length-1}`;$('stepper').value=stepIndex;
 $('step-detail').textContent=`${stepIndex===0?'Начальная точка':method==='hj'?'Базисная точка':'Пробная точка'}: (${num(p.x)}; ${num(p.y)}) · f = ${num(p.f,8)} · ${method==='hj'?'Вызовов f: '+p.calls:'Вызов f № '+p.n}`;
 const fs=s.map(p=>p.f),fmin=Math.min(...fs),fmax=Math.max(...fs),pad=Math.max(1,(fmax-fmin)*.08);
 const v=frame('values',1,r.functionCalls,fmin-pad,fmax+pad,'Вызовы f','f(x)');v.line(s.map(p=>[p.calls??p.n,p.f]),method==='hj'?blue:terra,2);v.dot(p.calls??p.n,p.f,method==='hj'?blue:terra);
 const all=s.flatMap(p=>[p.x,p.y]),mn=Math.min(...all),mx=Math.max(...all),pd=Math.max(1,(mx-mn)*.08);
 const co=frame('coordinates',0,s.length-1,mn-pd,mx+pd,'Номер шага','x₁, x₂');co.line(s.map((p,i)=>[i,p.x]),blue);co.line(s.map((p,i)=>[i,p.y]),terra);co.dot(stepIndex,p.x,blue);co.dot(stepIndex,p.y,terra);
 const se=frame('section',-120,30,-130,40,'x₁','f(x₁, 0)');se.line(Array.from({length:200},(_,i)=>{const x=-120+150*i/199;return [x,Lab.objective([x,0])];}),blue);se.dot(1,Lab.objective([1,0]),terra);
 const ra=frame('ray',0,10,-130,10,'t','f(x(t))');ra.line([[0,1+Math.exp(.01)],[10,1+Math.exp(.01)-124]],blue);
 drawSurface3d();
}
function drawSurface3d(){
 const el=$('surface-3d');if(!el||!window.Plotly||!results)return;
 const r=results[method],s=series(),shown=s.slice(0,stepIndex+1),coords=s.map(p=>[p.x,p.y]);
 const loX=Math.min(...coords.map(p=>p[0])),hiX=Math.max(...coords.map(p=>p[0])),loY=Math.min(...coords.map(p=>p[1])),hiY=Math.max(...coords.map(p=>p[1]));
 const padX=Math.max(2,(hiX-loX)*.16),padY=Math.max(2,(hiY-loY)*.16),xmin=loX-padX,xmax=hiX+padX,ymin=loY-padY,ymax=hiY+padY;
 const lin=(a,b,n)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1)),xs=lin(xmin,xmax,34),ys=lin(ymin,ymax,34);
 const z=(x,y)=>Lab.objective([x,y]);
 const surface={type:'surface',x:xs,y:ys,z:ys.map(y=>xs.map(x=>z(x,y))),colorscale:[[0,'#dbe8e1'],[.45,'#8cb6aa'],[1,'#245e70']],opacity:.83,showscale:false,hovertemplate:'x₁=%{x:.3f}<br>x₂=%{y:.3f}<br>f=%{z:.5f}<extra>Поверхность</extra>'};
 const trail={type:'scatter3d',mode:'lines+markers',x:shown.map(p=>p.x),y:shown.map(p=>p.y),z:shown.map(p=>p.f),line:{color:'#b75d41',width:6},marker:{size:2,color:'#b75d41'},name:'Траектория',hovertemplate:'Шаг %{pointNumber}<br>x₁=%{x:.4f}<br>x₂=%{y:.4f}<br>f=%{z:.6f}<extra></extra>'};
 const current=s[stepIndex],marker={type:'scatter3d',mode:'markers',x:[current.x],y:[current.y],z:[current.f],marker:{size:7,color:'#f0bd45',line:{color:'#26343b',width:2}},name:'Текущий шаг',hovertemplate:'Шаг '+stepIndex+'<br>x₁=%{x:.4f}<br>x₂=%{y:.4f}<br>f=%{z:.6f}<extra></extra>'};
 Plotly.react(el,[surface,trail,marker],{margin:{l:0,r:0,t:8,b:0},paper_bgcolor:'#fff',plot_bgcolor:'#fff',showlegend:true,legend:{orientation:'h',x:0,y:1.02},scene:{uirevision:'function-surface',xaxis:{title:'x₁',range:[xmin,xmax],backgroundcolor:'#f5f6f3',gridcolor:'#d9ddd9'},yaxis:{title:'x₂',range:[ymin,ymax],backgroundcolor:'#f5f6f3',gridcolor:'#d9ddd9'},zaxis:{title:'f(x₁, x₂)',backgroundcolor:'#f5f6f3',gridcolor:'#d9ddd9'},camera:{eye:{x:1.55,y:1.55,z:1.15}}}},{responsive:true,displaylogo:false,scrollZoom:true});
}
function render(){
 stop();const r=results[method],s=series();stepIndex=s.length-1;$('stepper').max=s.length-1;
 document.querySelectorAll('[data-method]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.method===method)));
 $('status').textContent=method==='hj'?`Лимит ${r.iterations} итераций; точность не достигнута`:'Интервал одномерного минимума не найден';$('calls').textContent=r.functionCalls;
 $('trajectory-title').textContent=method==='hj'?'Траектория базисных точек':'Пробы локализации по первой координате';
 $('values-caption').textContent=method==='hj'?'Показаны значения в принятых базисных точках. По горизонтали — накопленное число вызовов функции.':'Показаны все пробы локализации. Эти точки не являются завершёнными итерациями метода.';
 const kinds={'start':'Начальная','line':'Проба','accepted':'Принята','explore+':'Проба +h','explore-':'Проба −h'};
 const accepted=new Set(r.path.slice(1).map(p=>r.evaluations.findLast(q=>q.n<=p.calls&&q.x===p.x&&q.y===p.y&&q.f===p.f)?.n));
 $('history').innerHTML=r.evaluations.map(p=>`<tr><td>${p.n}</td><td>${num(p.x)}</td><td>${num(p.y)}</td><td>${num(p.f,8)}</td><td>${accepted.has(p.n)?'Принята':kinds[p.kind]}</td></tr>`).join('');
 const g=results.gs,h=results.hj,rows=[['Принятая точка',g.point,h.point].map((v,i)=>i?`(${num(v[0])}; ${num(v[1])})`:v),['f в принятой точке',num(g.value,8),num(h.value,8)],['Вызовов функции',g.functionCalls,h.functionCalls],['Вызовов производных',0,0],['Завершённых циклов / итераций',g.cycles,h.iterations],['Дроблений h','—',h.reductions],['Итоговый шаг h','—',num(h.finalStep)],['Достигнута точность ε','Нет','Нет'],['Причина остановки','Не найден интервал минимума','Лимит итераций']];
 $('comparison-body').innerHTML=rows.map(row=>'<tr>'+row.map(v=>`<td>${v}</td>`).join('')+'</tr>').join('');draw();
}
function calculate(){const d=new FormData($('parameters'));const o={start:[+d.get('x'),+d.get('y')],epsilon:+d.get('epsilon'),step:+d.get('step'),maxIterations:+d.get('iterations')};if(o.start.some(x=>Math.abs(x)>10000)||o.step>1000||o.epsilon<1e-9||o.epsilon>=o.step)throw Error('Для наглядного расчёта: |x⁰| ≤ 10000, шаг ≤ 1000 и 10⁻⁹ ≤ ε < h.');results={gs:Lab.gaussSeidel(o),hj:Lab.hookeJeeves(o)};if([...results.gs.evaluations,...results.hj.evaluations].some(p=>!Number.isFinite(p.f)))throw Error('Значения выходят за числовой диапазон. Уменьшите исходные координаты или шаг.');$('error').textContent='';render();}
$('parameters').addEventListener('submit',e=>{e.preventDefault();try{calculate();}catch(err){$('error').textContent=err.message;}});
document.querySelectorAll('[data-method]').forEach(b=>b.addEventListener('click',()=>{method=b.dataset.method;render();}));
$('stepper').addEventListener('input',e=>{stop();stepIndex=+e.target.value;draw();});$('last').addEventListener('click',()=>{stop();stepIndex=series().length-1;draw();});
$('play').addEventListener('click',()=>{if(timer){stop();return;}if(stepIndex===series().length-1)stepIndex=0;$('play').textContent='Ⅱ';$('play').setAttribute('aria-label','Остановить воспроизведение');timer=setInterval(()=>{if(stepIndex<series().length-1){stepIndex++;draw();}else stop();},180);});
$('csv').addEventListener('click',()=>{const r=results[method];const csv='\uFEFFcall;x1;x2;f;operation\n'+r.evaluations.map(p=>[p.n,p.x,p.y,p.f,p.kind].join(';')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`lab2-${method}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
let resize;window.addEventListener('resize',()=>{clearTimeout(resize);resize=setTimeout(draw,150);});calculate();
