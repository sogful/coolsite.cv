const form=document.querySelector('#convert-form');
const picker=document.querySelector('#audio-file');
const dropzone=document.querySelector('#dropzone');
const fileTitle=document.querySelector('#file-title');
const fileSubtitle=document.querySelector('#file-subtitle');
const button=document.querySelector('#convert-button');
const statusPanel=document.querySelector('.status-panel');
const statusHeading=document.querySelector('#status-heading');
const statusCopy=document.querySelector('#status-copy');
const progress=document.querySelector('#progress-track');
const result=document.querySelector('#result');
const catalog=document.querySelector('#catalog-status');
const maxBytes=100*1024*1024;
let objectUrl;

function prettySize(bytes){return bytes<1048576?`${Math.ceil(bytes/1024)} KB`:`${(bytes/1048576).toFixed(1)} MB`;}
function showFile(file){
  if(!file)return;
  fileTitle.textContent=file.name;
  fileSubtitle.textContent=`${prettySize(file.size)} · ready to convert`;
  dropzone.classList.add('has-file');
}
picker.addEventListener('change',()=>showFile(picker.files[0]));
dropzone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();picker.click();}});
for(const name of ['dragenter','dragover'])dropzone.addEventListener(name,event=>{event.preventDefault();dropzone.classList.add('dragging');});
for(const name of ['dragleave','drop'])dropzone.addEventListener(name,event=>{event.preventDefault();dropzone.classList.remove('dragging');});
dropzone.addEventListener('drop',event=>{const file=event.dataTransfer.files[0];if(file){const transfer=new DataTransfer();transfer.items.add(file);picker.files=transfer.files;showFile(file);}});
function status(kind,title,copy){statusPanel.classList.remove('busy','done','error');if(kind)statusPanel.classList.add(kind);statusHeading.textContent=title;statusCopy.textContent=copy;}

fetch('/api/status').then(response=>{if(!response.ok)throw new Error('Local converter is not serving this page.');return response.json();}).then(data=>{
  if(data.ready){catalog.textContent=`Local library ready · ${data.sounds.toLocaleString()} sounds · ${data.index_windows.toLocaleString()} indexed windows`;}
  else catalog.textContent=data.message||'Local SFX library needs setup. See the README.';
}).catch(()=>{
  catalog.replaceChildren(document.createTextNode('Static preview only. '));
  const link=document.createElement('a');link.href='http://127.0.0.1:8765/';link.textContent='Open local converter';link.style.color='var(--lime)';link.style.fontWeight='700';
  catalog.append(link);
});

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const file=picker.files[0];
  if(!file){status('error','Choose an audio file','Select a WAV, OGG or MP3 file to continue.');return;}
  if(file.size>maxBytes){status('error','That file is too large','The local converter accepts audio files up to 100 MB.');return;}
  const data=new FormData(form);data.set('file',file);
  button.disabled=true;progress.hidden=false;result.hidden=true;
  status('busy','Building your level','Searching the local SFX library and arranging the triggers. A detailed match can take a few minutes.');
  const started=Date.now();
  try{
    const response=await fetch('/api/convert',{method:'POST',body:data});
    if(!response.ok){let detail='Conversion failed. Check the audio and local SFX library.';try{detail=(await response.json()).error||detail;}catch{}throw new Error(detail);}
    const blob=await response.blob();
    const disposition=response.headers.get('Content-Disposition')||'';
    const encodedName=disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
    const plainName=disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const filename=encodedName?decodeURIComponent(encodedName):(plainName||'song.gmd');
    objectUrl&&URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);
    const link=document.createElement('a');link.className='download-link';link.href=objectUrl;link.download=filename;link.textContent='↓  DOWNLOAD .GMD LEVEL';
    result.replaceChildren(link);
    const details=[];
    const events=response.headers.get('X-Conversion-Events');if(events)details.push(`${Number(events).toLocaleString()} triggers`);
    const ids=response.headers.get('X-Conversion-Sounds');if(ids)details.push(`${Number(ids).toLocaleString()} unique SFX`);
    details.push(`${Math.round((Date.now()-started)/1000)}s`);
    const meta=document.createElement('p');meta.className='result-meta';meta.textContent=`${details.join(' · ')}. Your uploaded audio has been discarded.`;result.append(meta);
    result.hidden=false;progress.hidden=true;status('done','Your level is ready','Import the downloaded .gmd into Geometry Dash to play your SFX version.');
  }catch(error){progress.hidden=true;status('error','Could not make that level',error.message);}
  finally{button.disabled=false;}
});
