"use client";
import { useEffect, useRef, type RefObject } from "react";
import styles from "../trip-form.module.css";
type Point={x:number;y:number};
/** Coordenadas normalizadas: redimensionar no borra ni deforma el trazo capturado. */
export function SignaturePad({canvasRef,onChange,disabled=false}:{canvasRef:RefObject<HTMLCanvasElement|null>;onChange:(signed:boolean)=>void;disabled?:boolean}) {
  const strokes=useRef<Point[][]>([]); const drawing=useRef(false);
  const paint=()=>{
    const canvas=canvasRef.current;if(!canvas)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    const ratio=devicePixelRatio||1;canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);
    const ctx=canvas.getContext("2d");if(!ctx)return;ctx.scale(ratio,ratio);ctx.strokeStyle="#10213b";ctx.lineWidth=2.4;ctx.lineCap="round";ctx.lineJoin="round";
    for(const stroke of strokes.current){ctx.beginPath();stroke.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x*r.width,p.y*r.height);else ctx.lineTo(p.x*r.width,p.y*r.height);});ctx.stroke();}
  };
  const repaint=useRef(paint);repaint.current=paint;
  useEffect(()=>{const node=canvasRef.current;if(!node)return;const observer=new ResizeObserver(()=>repaint.current());observer.observe(node);return()=>observer.disconnect();},[canvasRef]);
  const point=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};};
  const finish=()=>{if(!drawing.current)return;drawing.current=false;if((strokes.current.at(-1)?.length||0)<2)strokes.current.pop();onChange(strokes.current.some(s=>s.length>1));paint();};
  return <><canvas ref={canvasRef} className={styles.signature} aria-label="Lienzo de firma del receptor" aria-disabled={disabled}
    onPointerDown={e=>{if(disabled)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;strokes.current.push([point(e)]);}}
    onPointerMove={e=>{if(!drawing.current||disabled)return;const p=point(e);const last=strokes.current.at(-1)?.at(-1);if(last&&Math.hypot(p.x-last.x,p.y-last.y)<.01)return;strokes.current.at(-1)?.push(p);const canvas=e.currentTarget;const ctx=canvas.getContext("2d");const r=canvas.getBoundingClientRect();if(ctx&&last){ctx.beginPath();ctx.moveTo(last.x*r.width,last.y*r.height);ctx.lineTo(p.x*r.width,p.y*r.height);ctx.stroke();}}}
    onPointerUp={finish} onPointerCancel={finish} />
    {!disabled&&<button type="button" onClick={()=>{strokes.current=[];paint();onChange(false);}}>Limpiar firma</button>}
    <p>Firma con el dedo o un puntero. Si el receptor no puede firmar, consulta a soporte; la firma no se sustituye por un nombre escrito.</p></>;
}
