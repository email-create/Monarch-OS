import { useState, useEffect, useRef, useCallback } from "react";
import { saveData, subscribe } from "./firebase";

// ─── Palette ───
const C = {
  gold: "#D4AF37", goldLight: "#E8C84A", goldPale: "#F0DFA0", goldDim: "#B8962E",
  goldMuted: "rgba(212,175,55,0.12)", goldBorder: "rgba(212,175,55,0.20)",
  bg: "#0D0D0D", bgCard: "#161616", bgCardHover: "#1C1C1C", bgInput: "#1A1A1A",
  bgSidebar: "linear-gradient(180deg, #131313 0%, #0F0F0F 100%)",
  text: "#F0EDE6", textSec: "#9A9590", textMuted: "#6B6560",
  green: "#34C759", red: "#E53935", orange: "#FF9500", blue: "#007AFF", purple: "#8B5CF6",
  cyan: "#00BCD4",
};
const FH = "'Cormorant Garamond','Georgia',serif";
const FB = "'DM Sans','Helvetica Neue',sans-serif";
const PROFILES = ["Jorge","Winston"];
const CALL_STATUSES = ["Not Called","Called","Voicemail","Interested","Not Interested","Negotiating","Under Contract","Rejected"];
const DEAL_STATUSES = ["Prospect","Negotiating","Under Contract","Assigned","Closed"];
const STATUS_COLORS = { Prospect:C.blue, Negotiating:C.orange, "Under Contract":C.purple, Assigned:C.cyan, Closed:C.green, Interested:C.green, "Not Interested":C.red, Voicemail:"#6B6560", Called:C.blue, "Not Called":"#3A3A3A", Rejected:C.red };

const TEMPLATES = {
  coldCall:{title:"Cold Call Script",content:`Hi [Name], this is [Your Name] with JW Monarch. I'm reaching out because I noticed you own a property at [Address]. I work with investors who are actively buying land in [County/City], and I wanted to see if you'd ever considered selling.\n\nI know it might seem random, but we've helped a lot of landowners in the area get a fair cash offer with a quick, hassle-free closing — no repairs, no commissions.\n\nWould you be open to hearing what we could offer for your property?\n\n[If Yes] Great — let me grab a few details to put together a number for you.\n[If No] No problem at all! If anything changes, feel free to reach out. Have a great day.`},
  emailTemplate:{title:"Initial Email Template",content:`Subject: Cash Offer for Your Property at [Address]\n\nHi [Name],\n\nMy name is [Your Name] with JW Monarch. I'm reaching out because I noticed you own property at [Address] in [County].\n\nWe work with a network of land buyers and are currently looking to purchase properties in your area. We offer:\n\n• Fair cash offers\n• Quick closing (as fast as 14 days)\n• No commissions or hidden fees\n• We handle all paperwork\n\nWould you be interested in receiving a no-obligation offer? Simply reply to this email or call me at [Phone].\n\nBest regards,\n[Your Name]\nJW Monarch`},
  objections:{title:"Objection Responses",content:`"I'm not interested in selling."\n→ I completely understand. Just so you know, we're not pushy — but if circumstances ever change, we'd love to be your first call. Can I check back in a few months?\n\n"How did you get my number?"\n→ Your property is part of the public record, and we reach out to landowners in areas where our buyers are actively looking. No pressure at all.\n\n"I need to think about it."\n→ Absolutely, take your time. I can send you a written offer so you have something concrete to look at. What email should I send it to?\n\n"Your offer is too low."\n→ I understand. Our offers are based on recent comparable sales and current market conditions. What number did you have in mind? Let's see if we can find common ground.\n\n"I want to list with a realtor."\n→ That's a great option too. Just keep in mind that with us, there are no commissions, no waiting for showings, and we can close on your timeline. It might be worth comparing both options.`},
  voicemail:{title:"Voicemail Script",content:`Hi [Name], this is [Your Name] with JW Monarch. I'm calling about your property at [Address]. We have buyers looking for land in your area and I'd love to discuss a potential cash offer with you. No obligation, no pressure. Give me a call back at [Phone] when you get a chance. Thanks and have a great day!`},
  followUpEmail:{title:"Follow-Up Email",content:`Subject: Following Up — Your Property at [Address]\n\nHi [Name],\n\nI wanted to follow up on my previous message about your property at [Address]. Our buyers are still actively looking in [County], and I'd love to connect with you if you're open to discussing an offer.\n\nAs a reminder, we offer:\n• Cash purchase — no financing delays\n• We cover closing costs\n• Close in as little as 14 days\n• Simple, hassle-free process\n\nIf you're interested, simply reply here or call me at [Phone]. No pressure either way!\n\nBest,\n[Your Name]\nJW Monarch`}
};

const HELP_CONTENT = {
  dashboard:{title:"Dashboard",desc:"Your command center overview showing key metrics, quick actions, and recent activity at a glance.",features:["View active deals, pipeline profit, and buyer count","Quick action buttons to jump to common tasks","Recent call activity and deal pipeline donut chart","Compare view to see both profiles side-by-side"]},
  sellers:{title:"Seller Management",desc:"Track and manage all your property seller contacts. Each profile maintains their own separate seller list.",features:["Add, edit, and archive sellers","Import sellers from ProStream data","Track seller status through the sales cycle","Link sellers to specific buyers","Set follow-up dates for each seller"]},
  calls:{title:"Call Tracker",desc:"Log and track all your outreach calls. Call data is personal to each profile.",features:["Log calls with date, time, and outcome","Track what was discussed and objections raised","Auto-update seller status based on call results","Schedule follow-up calls","View call stats (total, this week, interested)"]},
  analyzer:{title:"Deal Analyzer",desc:"Calculate offer prices and analyze deal profitability before making offers.",features:["Input property details (acres, FMV, buyer price)","Get recommended offer price at 60% of FMV","See projected profit and buyer savings","Save analyzed deals directly to your pipeline"]},
  pipeline:{title:"Deal Pipeline",desc:"Manage your active deals from prospect to close. Each profile has their own pipeline.",features:["Track deals through 5 stages: Prospect → Closed","Link deals to specific buyers","Set target close dates","Filter by status or buyer","View profit projections per deal"]},
  templates:{title:"Outreach Templates",desc:"Pre-built scripts and email templates for cold calling, follow-ups, and handling objections. Shared across both profiles.",features:["Cold call script with branching responses","Initial email template","Objection handling responses","Voicemail script","Follow-up email template","One-click copy to clipboard"]},
  metrics:{title:"Performance Metrics",desc:"Track your personal performance across calls, conversions, and revenue.",features:["Total calls and conversion rate","Average profit per deal","Pipeline profit and revenue tracking","Profit breakdown by buyer"]},
  matching:{title:"Buyer Matching",desc:"Automatically match sellers to buyers based on location preferences.",features:["Auto-flag sellers matching buyer criteria","Match based on buyer location preferences","Score and rank matches by relevance","View all matches in one place"]},
  financial:{title:"Financial Tracking",desc:"Track revenue, profit, and cost metrics. Personal to each profile.",features:["Total revenue and YTD profit","Average profit per deal","Calls per deal ratio","Profit breakdown by buyer"]},
  calendar:{title:"Calendar / Tasks",desc:"Manage follow-ups and tasks. Each profile has their own calendar.",features:["View follow-ups due today","See upcoming tasks this week","Mark sellers as called directly","Track overdue follow-ups"]},
  velocity:{title:"Pipeline Velocity",desc:"Analyze how deals move through your pipeline stages.",features:["Deal count per stage","Stage-to-stage conversion rates","Visual progress bars","Active deal age tracking"]},
  market:{title:"Market Analysis",desc:"Track pricing trends and market data by area. Shared across profiles.",features:["Log average prices per target area","Track price per acre over time","Record deal counts by area","Add notes and observations"]},
  feedback:{title:"Feedback Loop",desc:"Record lessons learned and script effectiveness after deals. Personal to each profile.",features:["Link feedback to specific deals","Track won/lost/stalled outcomes","Record lessons learned","Rate script effectiveness","Post-mortem analysis"]},
  bulk:{title:"Bulk Operations",desc:"Import multiple sellers at once and schedule bulk follow-ups.",features:["Bulk import from CSV/tab data","Mass follow-up scheduling","Import directly to your seller list"]},
  data:{title:"Data Management",desc:"Export data and manage storage across all sections.",features:["Export any data type to CSV","View record counts per section","Clear all data with confirmation"]},
  buyers:{title:"Buyer Management",desc:"Manage your buyer network. Buyers are shared across both profiles.",features:["Add and edit buyer profiles","Set lot size and price criteria","Specify preferred locations","Toggle buyers active/inactive","Link buyers to deals and sellers"]},
  map:{title:"Seller Map",desc:"Visualize your sellers and buyer territories on an interactive map.",features:["See all geocoded sellers as colored pins (color = status)","Buyer territories shown as gold circles","Click pins for seller details and quick call","Filter by status, toggle buyers, show archived","Auto-geocoding runs in background for new sellers"]}
};

const COUNTY_COORDS = {
  "broward":[26.19,-80.36],"miami-dade":[25.77,-80.29],"miami dade":[25.77,-80.29],"palm beach":[26.71,-80.06],
  "orange":[28.38,-81.38],"hillsborough":[27.90,-82.35],"pinellas":[27.88,-82.72],"duval":[30.33,-81.66],
  "lee":[26.57,-81.87],"collier":[26.11,-81.40],"osceola":[28.06,-81.07],"brevard":[28.26,-80.74],
  "polk":[27.95,-81.70],"volusia":[29.03,-81.09],"seminole":[28.71,-81.24],"sarasota":[27.18,-82.37],
  "manatee":[27.48,-82.39],"pasco":[28.30,-82.43],"lake":[28.77,-81.72],"st. lucie":[27.38,-80.39],
  "st lucie":[27.38,-80.39],"martin":[27.08,-80.41],"indian river":[27.69,-80.57],"charlotte":[26.89,-82.01],
  "hernando":[28.55,-82.47],"citrus":[28.85,-82.52],"marion":[29.21,-82.06],"alachua":[29.67,-82.37],
};

const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  buyers: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  sellers: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  calls: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  analyzer: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  pipeline: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  templates: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  metrics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  matching: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  financial: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  velocity: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  market: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  feedback: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  bulk: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  data: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  mapPin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
};

const NAV_ITEMS = [
  {id:"dashboard",label:"Dashboard",icon:Icons.dashboard},
  {id:"buyers",label:"Buyers",icon:Icons.buyers},
  {id:"sellers",label:"Sellers",icon:Icons.sellers},
  {id:"calls",label:"Call Tracker",icon:Icons.calls},
  {id:"analyzer",label:"Analyzer",icon:Icons.analyzer},
  {id:"pipeline",label:"Pipeline",icon:Icons.pipeline},
  {id:"templates",label:"Templates",icon:Icons.templates},
  {id:"metrics",label:"Metrics",icon:Icons.metrics},
  {id:"matching",label:"Buyer Match",icon:Icons.matching},
  {id:"financial",label:"Financial",icon:Icons.financial},
  {id:"calendar",label:"Calendar",icon:Icons.calendar},
  {id:"map",label:"Map",icon:Icons.mapPin},
  {id:"velocity",label:"Velocity",icon:Icons.velocity},
  {id:"market",label:"Market",icon:Icons.market},
  {id:"feedback",label:"Feedback",icon:Icons.feedback},
  {id:"bulk",label:"Bulk Ops",icon:Icons.bulk},
  {id:"data",label:"Data Mgmt",icon:Icons.data},
];

// ─── Storage paths ───
const pPath = (profile, type) => `personal/${profile}_${type}`;
const sPath = (type) => `shared/${type}`;
const uid = () => crypto.randomUUID();
const fmt$ = n => "$"+Number(n||0).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0});
const fmtDate = d => d ? new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "—";
const fmtDateFull = d => d ? new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—";
const todayStr = () => new Date().toISOString().split("T")[0];
const getGreeting = () => { const h=new Date().getHours(); return h<12?"Good Morning":h<17?"Good Afternoon":"Good Evening"; };

// ─── Shared Components ───
const Badge = ({children, color}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,letterSpacing:0.3,background:color?color+"18":C.goldMuted,color:color||C.gold,whiteSpace:"nowrap"}}>{children}</span>
);

const Card = ({children, style, onClick, hover, className}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div className={className} onMouseEnter={hover?()=>setHovered(true):undefined} onMouseLeave={hover?()=>setHovered(false):undefined} onClick={onClick}
      style={{background:C.bgCard,border:`1px solid ${C.goldBorder}`,borderRadius:16,padding:24,transition:"all 0.3s cubic-bezier(0.16,1,0.3,1)",cursor:onClick?"pointer":"default",...(hovered?{borderColor:C.gold+"50",transform:"translateY(-2px)",boxShadow:`0 12px 32px rgba(212,175,55,0.06)`}:{}),...style}}
    >{children}</div>
  );
};

const FormField = ({label,children,full}) => (
  <div style={full?{marginBottom:14}:{}}>
    <label style={{display:"block",fontSize:11,color:C.textSec,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6,fontWeight:500}}>{label}</label>
    {children}
  </div>
);

const Modal = ({title, onClose, children, wide}) => {
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose();};document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[onClose]);
  return (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(12px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
    <div style={{background:"#181818",border:`1px solid ${C.goldBorder}`,borderRadius:20,maxWidth:wide?800:560,width:"100%",maxHeight:"85vh",overflowY:"auto",padding:32,boxShadow:"0 24px 64px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h3 style={{margin:0,color:C.goldLight,fontWeight:400,fontSize:20,letterSpacing:1,fontFamily:FH}}>{title}</h3>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:C.textSec,cursor:"pointer",padding:"8px 14px",fontSize:14}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);};

const EmptyState = ({icon,msg,action,onAction}) => (
  <div style={{textAlign:"center",padding:"56px 20px"}}>
    <div style={{fontSize:44,marginBottom:14,opacity:0.25}}>{icon||"◇"}</div>
    <p style={{color:C.textMuted,fontSize:14,marginBottom:action?18:0,lineHeight:1.6}}>{msg}</p>
    {action && <button style={btnStyle} onClick={onAction}>{action}</button>}
  </div>
);

const HelpButton = ({pageId}) => {
  const [show,setShow]=useState(false);
  const info = HELP_CONTENT[pageId];
  if(!info) return null;
  return (<>
    <div onClick={()=>setShow(true)} style={{position:"fixed",bottom:24,right:24,width:44,height:44,borderRadius:22,background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:"#0D0D0D",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:20,fontWeight:700,fontFamily:FH,zIndex:999,boxShadow:"0 4px 20px rgba(212,175,55,0.3)"}}>?</div>
    {show && <Modal title={info.title} onClose={()=>setShow(false)}>
      <p style={{color:C.textSec,fontSize:14,lineHeight:1.7,marginBottom:18}}>{info.desc}</p>
      <div style={{fontSize:13,color:C.goldLight,fontWeight:500,fontFamily:FH,marginBottom:10}}>Key Features</div>
      {info.features.map((f,i)=><div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}><span style={{color:C.gold,fontSize:14,lineHeight:1.5}}>◆</span><span style={{color:C.text,fontSize:13,lineHeight:1.5}}>{f}</span></div>)}
    </Modal>}
  </>);
};

const inputStyle = {width:"100%",padding:"11px 16px",background:C.bgInput,border:`1px solid ${C.goldBorder}`,borderRadius:12,color:C.text,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",transition:"border-color 0.2s, box-shadow 0.2s"};
const selectStyle = {...inputStyle,appearance:"auto"};
const textareaStyle = {...inputStyle,minHeight:80,resize:"vertical"};
const btnStyle = {padding:"11px 24px",background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:"#0B0B0F",border:"none",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:700,letterSpacing:0.5,fontFamily:"inherit",transition:"all 0.2s"};
const btnOutline = {padding:"11px 24px",background:"transparent",color:C.gold,border:`1px solid ${C.goldBorder}`,borderRadius:12,cursor:"pointer",fontSize:13,letterSpacing:0.5,fontFamily:"inherit",transition:"all 0.2s"};
const btnSmall = {padding:"7px 16px",background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:"#0B0B0F",border:"none",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"};
const btnDanger = {padding:"7px 16px",background:"rgba(229,57,53,0.12)",color:C.red,border:`1px solid rgba(229,57,53,0.25)`,borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"inherit"};
const formRow = {display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14};
const tableStyle = {width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:13};
const thStyle = {textAlign:"left",padding:"14px 16px",color:"#0D0D0D",fontSize:11,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,background:`linear-gradient(135deg,${C.gold},${C.goldDim})`};
const tdStyle = {padding:"14px 16px",borderBottom:`1px solid ${C.goldBorder}`,color:C.text,verticalAlign:"middle"};

// ═══ MAIN APP ═══
export default function MonarchOS() {
  const [page, setPage] = useState("welcome");
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(() => { try { return localStorage.getItem("monarchOS_activeProfile")||""; } catch{return "";} });
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [prefillCallId, setPrefillCallId] = useState("");
  const addToast = (message, type="success") => { const id=crypto.randomUUID(); setToasts(p=>[...p,{id,message,type}]); setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500); };

  // SHARED data (same for both profiles)
  const [buyers, setBuyers] = useState([]);
  const [marketData, setMarketData] = useState([]);

  // PERSONAL data (keyed per profile)
  const [sellers, setSellers] = useState([]);
  const [calls, setCalls] = useState([]);
  const [deals, setDeals] = useState([]);
  const [feedback, setFeedback] = useState([]);

  // OTHER profile data for compare view
  const [otherSellers, setOtherSellers] = useState([]);
  const [otherDeals, setOtherDeals] = useState([]);

  // Track if data was loaded from Firebase (to avoid saving empty on first render)
  const initialized = useRef({shared:false, personal:false});
  const skipSave = useRef(true);

  // Subscribe to SHARED data (always active)
  useEffect(() => {
    const unsubs = [
      subscribe(sPath("buyers"), (data) => { setBuyers(data || []); initialized.current.shared = true; }),
      subscribe(sPath("market"), (data) => { setMarketData(data || []); }),
    ];
    setTimeout(() => { skipSave.current = false; setLoading(false); }, 1500);
    return () => unsubs.forEach(u => u());
  }, []);

  // Subscribe to PERSONAL data when profile changes
  useEffect(() => {
    if (!profile) return;
    skipSave.current = true;
    const unsubs = [
      subscribe(pPath(profile,"sellers"), (data) => { setSellers(data || []); initialized.current.personal = true; }),
      subscribe(pPath(profile,"calls"), (data) => { setCalls(data || []); }),
      subscribe(pPath(profile,"deals"), (data) => { setDeals(data || []); }),
      subscribe(pPath(profile,"feedback"), (data) => { setFeedback(data || []); }),
    ];
    setTimeout(() => { skipSave.current = false; }, 1500);
    setPage("dashboard");
    return () => unsubs.forEach(u => u());
  }, [profile]);

  // Subscribe to OTHER profile data (for compare view)
  useEffect(() => {
    const other = PROFILES.find(p=>p!==profile) || "";
    if (!other) return;
    const unsubs = [
      subscribe(pPath(other,"sellers"), (data) => { setOtherSellers(data || []); }),
      subscribe(pPath(other,"deals"), (data) => { setOtherDeals(data || []); }),
    ];
    return () => unsubs.forEach(u => u());
  }, [profile]);

  // Save SHARED to Firebase on change
  useEffect(() => { if(!skipSave.current) saveData(sPath("buyers"), buyers); }, [buyers]);
  useEffect(() => { if(!skipSave.current) saveData(sPath("market"), marketData); }, [marketData]);
  // Save PERSONAL to Firebase on change
  useEffect(() => { if(!skipSave.current && profile) saveData(pPath(profile,"sellers"), sellers); }, [sellers]);
  useEffect(() => { if(!skipSave.current && profile) saveData(pPath(profile,"calls"), calls); }, [calls]);
  useEffect(() => { if(!skipSave.current && profile) saveData(pPath(profile,"deals"), deals); }, [deals]);
  useEffect(() => { if(!skipSave.current && profile) saveData(pPath(profile,"feedback"), feedback); }, [feedback]);

  const switchProfile = (p) => {
    try { localStorage.setItem("monarchOS_activeProfile", p); } catch{}
    setProfile(p);
  };

  const otherProfile = PROFILES.find(p=>p!==profile) || "";

  // ─── Geocoding queue ───
  const [geoProgress, setGeoProgress] = useState({current:0,total:0,active:false});
  const geoTimeout = useRef(null);
  useEffect(()=>{
    if(!profile||!sellers.length) return;
    const queue=sellers.filter(s=>!s.archived&&s.address&&s.lat===undefined&&s.lon===undefined);
    if(!queue.length) return;
    setGeoProgress({current:0,total:queue.length,active:true});
    let i=0;
    const processNext=()=>{
      if(i>=queue.length){setGeoProgress(p=>({...p,active:false}));return;}
      const s=queue[i];
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(s.address)}`,{headers:{"Accept":"application/json"}})
        .then(r=>r.json()).then(data=>{
          const lat=data[0]?parseFloat(data[0].lat):null;
          const lon=data[0]?parseFloat(data[0].lon):null;
          setSellers(prev=>prev.map(x=>x.id===s.id?{...x,lat,lon}:x));
          i++;setGeoProgress(p=>({...p,current:i}));
          geoTimeout.current=setTimeout(processNext,1100);
        }).catch(()=>{
          setSellers(prev=>prev.map(x=>x.id===s.id?{...x,lat:null,lon:null}:x));
          i++;setGeoProgress(p=>({...p,current:i}));
          geoTimeout.current=setTimeout(processNext,1100);
        });
    };
    geoTimeout.current=setTimeout(processNext,500);
    return()=>{if(geoTimeout.current)clearTimeout(geoTimeout.current);};
  },[sellers.filter(s=>!s.archived&&s.address&&s.lat===undefined).length]);

  const nav = id => { setPage(id); setMobileNav(false); };
  const activeBuyers = buyers.filter(b => b.active !== false);
  const weekCalls = calls.filter(c => { const d=new Date(c.date); return d>=new Date(Date.now()-7*864e5); });
  const closedDeals = deals.filter(d => d.status==="Closed");
  const pipelineProfit = deals.filter(d=>d.status!=="Closed").reduce((s,d)=>s+(Number(d.profit)||0),0);
  const totalRevenue = closedDeals.reduce((s,d)=>s+(Number(d.buyerPrice)||0),0);
  const totalProfit = closedDeals.reduce((s,d)=>s+(Number(d.profit)||0),0);
  const todayFollowUps = sellers.filter(l=>l.followUp && l.followUp<=todayStr());

  // ═══ WELCOME SCREEN ═══
  const WelcomePage = () => {
    const [phase, setPhase] = useState(0);
    useEffect(() => { setTimeout(()=>setPhase(1),600); setTimeout(()=>setPhase(2),1200); setTimeout(()=>setPhase(3),1800); }, []);
    return (
      <div style={{position:"fixed",inset:0,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,overflow:"hidden",fontFamily:FH}}>
        <div style={{position:"absolute",width:800,height:800,borderRadius:"50%",border:`1px solid rgba(212,175,55,0.04)`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",border:`1px solid rgba(212,175,55,0.06)`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,175,55,0.06) 0%,transparent 70%)",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
        <div style={{textAlign:"center",position:"relative",zIndex:1,maxWidth:520,padding:40}}>
          <div style={{marginBottom:36,opacity:phase>=1?1:0,transform:phase>=1?"scale(1) translateY(0)":"scale(0.8) translateY(20px)",transition:"all 1.2s cubic-bezier(0.16,1,0.3,1)"}}>
            <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
              <path d="M40 8L10 30L18 52H62L70 30L40 8Z" stroke={C.gold} strokeWidth="1" fill="none" opacity="0.3"/>
              <path d="M20 28L40 14L60 28" stroke={C.gold} strokeWidth="1.5" fill="none"/>
              <circle cx="20" cy="28" r="3" fill={C.gold} opacity="0.8"/><circle cx="40" cy="14" r="3.5" fill={C.gold}/><circle cx="60" cy="28" r="3" fill={C.gold} opacity="0.8"/>
              <circle cx="40" cy="34" r="2" fill={C.gold} opacity="0.4"/>
              <line x1="20" y1="28" x2="20" y2="22" stroke={C.gold} strokeWidth="1" opacity="0.5"/><line x1="40" y1="14" x2="40" y2="6" stroke={C.gold} strokeWidth="1" opacity="0.5"/><line x1="60" y1="28" x2="60" y2="22" stroke={C.gold} strokeWidth="1" opacity="0.5"/>
              <circle cx="20" cy="20" r="2" fill={C.gold} opacity="0.6"/><circle cx="40" cy="4" r="2.5" fill={C.gold} opacity="0.7"/><circle cx="60" cy="20" r="2" fill={C.gold} opacity="0.6"/>
            </svg>
          </div>
          <div style={{opacity:phase>=1?1:0,transform:phase>=1?"translateY(0)":"translateY(24px)",transition:"all 1s cubic-bezier(0.16,1,0.3,1) 0.2s"}}>
            <div style={{fontSize:13,letterSpacing:8,color:C.gold,fontWeight:600,textTransform:"uppercase",marginBottom:8,fontFamily:FB}}>JW Monarch</div>
            <div style={{fontSize:52,fontWeight:300,color:C.goldLight,letterSpacing:4,lineHeight:1.1}}>Monarch OS</div>
            <div style={{width:80,height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"16px auto",opacity:0.6}}/>
            <p style={{fontSize:15,color:C.textSec,letterSpacing:2,fontWeight:300,fontFamily:FB}}>Land Wholesaling Command Center</p>
          </div>
          <div style={{marginTop:56,opacity:phase>=3?1:0,transform:phase>=3?"translateY(0)":"translateY(30px)",transition:"all 0.9s cubic-bezier(0.16,1,0.3,1)"}}>
            <p style={{fontSize:13,color:C.textMuted,marginBottom:20,letterSpacing:1,fontFamily:FB}}>Select your profile</p>
            <div style={{display:"flex",gap:16,justifyContent:"center"}}>
              {PROFILES.map(p=>(
                <button key={p} onClick={()=>switchProfile(p)} style={{padding:"18px 48px",borderRadius:14,border:`1px solid ${C.goldBorder}`,background:"rgba(212,175,55,0.06)",color:C.goldLight,fontSize:20,fontFamily:FH,fontWeight:400,letterSpacing:2,cursor:"pointer",transition:"all 0.3s"}}>{p}</button>
              ))}
            </div>
          </div>
          <p style={{marginTop:60,fontSize:10,color:C.textMuted,letterSpacing:3,opacity:0.4,fontFamily:FB}}>© {new Date().getFullYear()} JW MONARCH</p>
        </div>
      </div>
    );
  };

  // ═══ SIDEBAR ═══
  const sW = sidebarCollapsed ? 68 : 240;
  const Sidebar = ({mobile}) => (
    <div style={{width:mobile?260:sW,minWidth:mobile?260:sW,background:C.bgSidebar,borderRight:`1px solid ${C.goldBorder}`,display:"flex",flexDirection:"column",height:"100vh",overflowY:"auto",position:mobile?"fixed":"sticky",top:0,zIndex:mobile?1000:10,...(mobile?{left:0}:{}),transition:"width 0.3s, min-width 0.3s"}}>
      <div style={{padding:sidebarCollapsed?"18px 12px":"22px 20px",borderBottom:`1px solid ${C.goldBorder}`,display:"flex",alignItems:"center",gap:12,justifyContent:sidebarCollapsed?"center":"flex-start"}}>
        <svg width="28" height="22" viewBox="0 0 80 60" fill="none" style={{flexShrink:0}}>
          <path d="M20 28L40 14L60 28" stroke={C.gold} strokeWidth="2" fill="none"/>
          <circle cx="20" cy="28" r="2.5" fill={C.gold}/><circle cx="40" cy="14" r="3" fill={C.gold}/><circle cx="60" cy="28" r="2.5" fill={C.gold}/>
        </svg>
        {!sidebarCollapsed && <div><div style={{fontSize:10,letterSpacing:3,color:C.gold,fontWeight:600,textTransform:"uppercase",lineHeight:1}}>JW Monarch</div><div style={{fontSize:15,color:C.goldLight,fontWeight:400,letterSpacing:1,marginTop:3,fontFamily:FH}}>Monarch OS</div></div>}
      </div>
      {profile && !sidebarCollapsed && (
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.goldBorder}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:12,background:`linear-gradient(135deg,${C.gold}30,${C.gold}10)`,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontSize:14,fontWeight:600,flexShrink:0}}>{profile.charAt(0).toUpperCase()}</div>
          <div style={{minWidth:0}}><div style={{fontSize:13,color:C.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile}</div><div style={{fontSize:10,color:C.textMuted,letterSpacing:1}}>OPERATOR</div></div>
        </div>
      )}
      <nav style={{flex:1,padding:"10px 0",overflowY:"auto"}}>
        {NAV_ITEMS.map(n => (
          <div key={n.id} onClick={()=>nav(n.id)} title={sidebarCollapsed?n.label:undefined}
            style={{display:"flex",alignItems:"center",gap:12,padding:sidebarCollapsed?"12px 0":"11px 20px",justifyContent:sidebarCollapsed?"center":"flex-start",cursor:"pointer",background:page===n.id?"rgba(212,175,55,0.08)":"transparent",borderLeft:page===n.id&&!sidebarCollapsed?`3px solid ${C.gold}`:"3px solid transparent",color:page===n.id?C.gold:C.textSec,fontSize:13,letterSpacing:0.3,transition:"all 0.2s",fontWeight:page===n.id?500:400}}>
            <span style={{opacity:page===n.id?1:0.55,display:"flex",flexShrink:0}}>{n.icon}</span>
            {!sidebarCollapsed && <span>{n.label}</span>}
          </div>
        ))}
      </nav>
      {!sidebarCollapsed&&geoProgress.active&&<div style={{padding:"8px 20px",borderTop:`1px solid ${C.goldBorder}`}}><div style={{fontSize:11,color:C.textMuted}}>Geocoding {geoProgress.current}/{geoProgress.total}</div><div style={{height:3,borderRadius:2,background:"rgba(255,255,255,0.05)",marginTop:4}}><div style={{height:3,borderRadius:2,background:C.gold,width:`${(geoProgress.current/geoProgress.total)*100}%`,transition:"width 0.5s"}}/></div></div>}
      {!mobile && <div onClick={()=>setSidebarCollapsed(!sidebarCollapsed)} style={{padding:"14px",borderTop:`1px solid ${C.goldBorder}`,textAlign:"center",cursor:"pointer",color:C.textMuted,fontSize:16}}>{sidebarCollapsed?"»":"«"}</div>}
    </div>
  );

  // ═══ TOP BAR with Profile Switcher ═══
  const TopBar = ({title, subtitle}) => {
    const [showDrop,setShowDrop]=useState(false);
    const dropRef=useRef(null);
    useEffect(()=>{if(!showDrop)return;const h=e=>{if(dropRef.current&&!dropRef.current.contains(e.target))setShowDrop(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[showDrop]);
    return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
      <div><h1 style={{fontSize:26,fontWeight:400,color:C.text,margin:0,letterSpacing:1,fontFamily:FH}}>{title}</h1>{subtitle && <p style={{fontSize:13,color:C.textMuted,marginTop:4,letterSpacing:0.5}}>{subtitle}</p>}</div>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        {todayFollowUps.length > 0 && <div onClick={()=>setPage("calendar")} style={{position:"relative",cursor:"pointer",color:C.textSec,padding:8,borderRadius:10,background:"rgba(255,255,255,0.03)"}}>{Icons.bell}<span style={{position:"absolute",top:4,right:4,width:16,height:16,borderRadius:8,background:C.red,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{todayFollowUps.length}</span></div>}
        <div ref={dropRef} style={{position:"relative"}}>
          <div onClick={()=>setShowDrop(!showDrop)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRadius:12,background:"rgba(255,255,255,0.03)",cursor:"pointer",border:`1px solid ${showDrop?C.gold+"40":"transparent"}`}}>
            <div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${C.gold}30,${C.gold}10)`,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontSize:13,fontWeight:600}}>{(profile||"U").charAt(0).toUpperCase()}</div>
            <div><div style={{fontSize:13,color:C.text,fontWeight:500}}>{profile||"Select"}</div><div style={{fontSize:10,color:C.textMuted,letterSpacing:0.5}}>Operator</div></div>
            <span style={{color:C.textMuted,fontSize:10,marginLeft:4}}>▼</span>
          </div>
          {showDrop && <div style={{position:"absolute",top:"100%",right:0,marginTop:6,background:"#1E1E1E",border:`1px solid ${C.goldBorder}`,borderRadius:12,overflow:"hidden",zIndex:100,minWidth:160,boxShadow:"0 12px 32px rgba(0,0,0,0.5)"}}>
            {PROFILES.map(p=>(
              <div key={p} onClick={()=>{switchProfile(p);setShowDrop(false);}} style={{padding:"12px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:p===profile?"rgba(212,175,55,0.08)":"transparent",color:p===profile?C.gold:C.text,fontSize:13,borderBottom:`1px solid ${C.goldBorder}`}}>
                <div style={{width:26,height:26,borderRadius:8,background:`linear-gradient(135deg,${C.gold}30,${C.gold}10)`,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontSize:11,fontWeight:600}}>{p.charAt(0)}</div>
                {p}{p===profile&&<span style={{marginLeft:"auto",fontSize:10}}>✓</span>}
              </div>
            ))}
            <div onClick={()=>{setProfile("");setPage("welcome");setShowDrop(false);try{localStorage.removeItem("monarchOS_activeProfile");}catch{}}} style={{padding:"12px 18px",cursor:"pointer",color:C.textMuted,fontSize:12}}>Sign Out</div>
          </div>}
        </div>
      </div>
    </div>
  );};

  // ═══ DONUT CHART ═══
  const DonutChart = ({data, size=160, thickness=14}) => {
    const total = data.reduce((s,d)=>s+d.count,0) || 1;
    let cum = -90;
    const arcs = data.filter(d=>d.count>0).map(d => { const a=(d.count/total)*360; const s=cum; cum+=a; return{...d,start:s,angle:a}; });
    const r = (size/2)-thickness, cx=size/2, cy=size/2, rad=a=>a*Math.PI/180;
    return (
      <div style={{position:"relative",width:size,height:size,margin:"0 auto"}}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{width:"100%",height:"100%"}}>
          {arcs.length===0?<circle cx={cx} cy={cy} r={r} stroke={C.goldBorder} strokeWidth={thickness} fill="none"/>:arcs.map((a,i)=>{
            if(a.angle>=359.9) return <circle key={i} cx={cx} cy={cy} r={r} stroke={a.color} strokeWidth={thickness} fill="none"/>;
            const x1=cx+r*Math.cos(rad(a.start)),y1=cy+r*Math.sin(rad(a.start)),x2=cx+r*Math.cos(rad(a.start+a.angle)),y2=cy+r*Math.sin(rad(a.start+a.angle));
            return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${a.angle>180?"1":"0"} 1 ${x2} ${y2}`} stroke={a.color} strokeWidth={thickness} fill="none" strokeLinecap="round"/>;
          })}
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:30,fontWeight:400,color:C.text,lineHeight:1,fontFamily:FH}}>{total}</div>
          <div style={{fontSize:10,color:C.textMuted,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>Total</div>
        </div>
      </div>
    );
  };

  // ═══ DASHBOARD ═══
  const DashboardPage = () => {
    const [compare,setCompare]=useState(false);
    const activeDeals = deals.filter(d=>d.status!=="Closed");
    const convRate = calls.length ? ((closedDeals.length/calls.length)*100).toFixed(1) : "0";
    const stageCounts = DEAL_STATUSES.map(s=>({label:s,count:deals.filter(d=>d.status===s).length,color:STATUS_COLORS[s]}));
    const recentCalls = [...calls].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);
    const quickActions = [{label:"Add Seller",icon:Icons.sellers,color:C.blue,page:"sellers"},{label:"Log Call",icon:Icons.calls,color:C.green,page:"calls"},{label:"Analyze Deal",icon:Icons.analyzer,color:C.purple,page:"analyzer"},{label:"Pipeline",icon:Icons.pipeline,color:C.orange,page:"pipeline"}];

    // Other profile data for compare
    const oDeals = otherDeals;
    const oSellers = otherSellers;
    const oActiveDeals = oDeals.filter(d=>d.status!=="Closed");
    const oTodayFU = oSellers.filter(l=>l.followUp && l.followUp<=todayStr());
    const oThisWeek = oSellers.filter(l=>l.followUp).filter(l=>{const d=new Date(l.followUp);const now=new Date();return d>=now&&d<=new Date(now.getTime()+7*864e5);});
    const thisWeekSellers = sellers.filter(l=>l.followUp).filter(l=>{const d=new Date(l.followUp);const now=new Date();return d>=now&&d<=new Date(now.getTime()+7*864e5);});

    return (
      <div>
        <TopBar title={<>{getGreeting()}, <span style={{color:C.goldLight}}>{profile||"Operator"}</span></>} subtitle={new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}/>

        {/* Quick Actions */}
        <Card style={{padding:22,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:15,color:C.text,fontWeight:500,fontFamily:FH,letterSpacing:0.5}}>Quick Actions</div>
            <div onClick={()=>setCompare(!compare)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"6px 14px",borderRadius:10,border:`1px solid ${compare?C.gold+"60":C.goldBorder}`,background:compare?"rgba(212,175,55,0.08)":"transparent",transition:"all 0.2s"}}>
              <div style={{width:32,height:18,borderRadius:9,background:compare?C.gold:"rgba(255,255,255,0.1)",transition:"all 0.2s",position:"relative"}}><div style={{width:14,height:14,borderRadius:7,background:compare?"#0D0D0D":"#666",position:"absolute",top:2,left:compare?16:2,transition:"all 0.2s"}}/></div>
              <span style={{fontSize:11,color:compare?C.gold:C.textMuted,letterSpacing:0.5}}>Compare</span>
            </div>
          </div>
          <div className="qa-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {quickActions.map((a,i)=>(
              <div key={i} onClick={()=>setPage(a.page)} style={{background:`linear-gradient(135deg,${a.color}12,${a.color}06)`,border:`1px solid ${a.color}20`,borderRadius:14,padding:"22px 16px",textAlign:"center",cursor:"pointer",transition:"all 0.25s"}}>
                <div style={{color:a.color,marginBottom:10,display:"flex",justifyContent:"center"}}>{a.icon}</div>
                <div style={{fontSize:13,color:C.text,fontWeight:500,letterSpacing:0.3}}>{a.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
            {[{l:"Buyers",p:"buyers"},{l:"Templates",p:"templates"},{l:"Metrics",p:"metrics"},{l:"View All",p:"data"}].map(b=>(
              <button key={b.p} onClick={()=>setPage(b.p)} style={{padding:"8px 20px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:0.5,fontFamily:"inherit",background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:"#0D0D0D"}}>{b.l}</button>
            ))}
          </div>
        </Card>

        {/* Stats */}
        <div className="stats-row" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14,marginBottom:20}}>
          {[{val:activeDeals.length,label:"Active Deals",color:C.blue},{val:fmt$(pipelineProfit),label:"Pipeline Profit",color:C.green},{val:activeBuyers.length,label:"Active Buyers",color:C.purple},{val:weekCalls.length,label:"Calls This Week",color:C.orange},{val:closedDeals.length,label:"Deals Closed",color:C.green},{val:sellers.length,label:"Total Sellers",color:C.blue}].map((s,i)=>(
            <Card key={i} style={{padding:18}}>
              <div style={{width:8,height:8,borderRadius:4,background:s.color,marginBottom:10}}/>
              <div style={{fontSize:28,fontWeight:400,color:C.text,lineHeight:1.1,fontFamily:FH}}>{s.val}</div>
              <div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:6}}>{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Compare View */}
        {compare && (
          <div style={{marginBottom:20}}>
            <Card style={{borderColor:C.gold+"30"}}>
              <div style={{fontSize:16,color:C.goldLight,fontWeight:500,fontFamily:FH,marginBottom:18}}>Compare: {profile} vs {otherProfile}</div>
              <div className="dash-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                {/* My Pipeline */}
                <div>
                  <div style={{fontSize:13,color:C.gold,fontWeight:600,marginBottom:10,letterSpacing:0.5}}>{profile}'s Pipeline ({activeDeals.length})</div>
                  {activeDeals.length===0?<p style={{color:C.textMuted,fontSize:12}}>No active deals</p>:activeDeals.slice(0,5).map(d=>(
                    <div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}>
                      <span style={{color:C.text}}>{d.address||"—"}</span>
                      <Badge color={STATUS_COLORS[d.status]}>{d.status}</Badge>
                    </div>
                  ))}
                </div>
                {/* Other Pipeline */}
                <div>
                  <div style={{fontSize:13,color:C.purple,fontWeight:600,marginBottom:10,letterSpacing:0.5}}>{otherProfile}'s Pipeline ({oActiveDeals.length})</div>
                  {oActiveDeals.length===0?<p style={{color:C.textMuted,fontSize:12}}>No active deals</p>:oActiveDeals.slice(0,5).map(d=>(
                    <div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}>
                      <span style={{color:C.text}}>{d.address||"—"}</span>
                      <Badge color={STATUS_COLORS[d.status]}>{d.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{height:1,background:C.goldBorder,margin:"16px 0"}}/>
              <div className="dash-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                {/* My Follow-ups */}
                <div>
                  <div style={{fontSize:13,color:C.gold,fontWeight:600,marginBottom:10,letterSpacing:0.5}}>{profile}'s Follow-Ups This Week ({thisWeekSellers.length})</div>
                  {thisWeekSellers.length===0?<p style={{color:C.textMuted,fontSize:12}}>None scheduled</p>:thisWeekSellers.slice(0,5).map(l=>(
                    <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:12,borderBottom:`1px solid ${C.goldBorder}`}}>
                      <span style={{color:C.text}}>{l.name||l.address||l.phone}</span>
                      <span style={{color:C.textMuted}}>{fmtDate(l.followUp)}</span>
                    </div>
                  ))}
                </div>
                {/* Other Follow-ups */}
                <div>
                  <div style={{fontSize:13,color:C.purple,fontWeight:600,marginBottom:10,letterSpacing:0.5}}>{otherProfile}'s Follow-Ups This Week ({oThisWeek.length})</div>
                  {oThisWeek.length===0?<p style={{color:C.textMuted,fontSize:12}}>None scheduled</p>:oThisWeek.slice(0,5).map(l=>(
                    <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:12,borderBottom:`1px solid ${C.goldBorder}`}}>
                      <span style={{color:C.text}}>{l.name||l.address||l.phone}</span>
                      <span style={{color:C.textMuted}}>{fmtDate(l.followUp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Two Column */}
        <div className="dash-two-col" style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:18,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:18}}>
            <Card style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH}}>Recent Activity</div>
                <Badge>{calls.length} calls</Badge>
              </div>
              {recentCalls.length===0?<div style={{padding:"20px 22px"}}><p style={{color:C.textMuted,fontSize:13}}>No calls logged yet.</p></div>:<table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:0}}>Seller</th><th style={thStyle}>Date</th><th style={thStyle}>Result</th></tr></thead><tbody>{recentCalls.map(c=>{const l=sellers.find(x=>x.id===c.leadId);return(<tr key={c.id}><td style={tdStyle}>{l?l.name||l.address||l.phone:"—"}</td><td style={tdStyle}>{fmtDate(c.date)}</td><td style={tdStyle}><Badge color={STATUS_COLORS[c.result]}>{c.result}</Badge></td></tr>);})}</tbody></table>}
            </Card>
            {todayFollowUps.length>0&&<Card style={{borderColor:C.orange+"30"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:15,color:C.orange,fontWeight:500,fontFamily:FH}}>Follow-Ups Due</div><Badge color={C.orange}>{todayFollowUps.length} today</Badge></div>{todayFollowUps.slice(0,5).map(l=><div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.goldBorder}`}}><span style={{fontSize:13}}>{l.name||l.address}</span><button style={btnSmall} onClick={()=>setPage("calendar")}>View</button></div>)}</Card>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:18}}>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}><div><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH}}>Deal Pipeline</div><div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div></div><div style={{fontSize:28,fontWeight:400,color:C.text,fontFamily:FH}}>{deals.length}</div></div>
              <DonutChart data={stageCounts} size={160} thickness={14}/>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:14,justifyContent:"center"}}>{stageCounts.filter(s=>s.count>0).map(s=><div key={s.label} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.textSec}}><div style={{width:8,height:8,borderRadius:4,background:s.color}}/>{s.label}: {s.count}</div>)}</div>
            </Card>
            <Card style={{padding:20}}>
              <div style={{fontSize:15,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Conversion</div>
              <div style={{fontSize:36,fontWeight:400,color:C.goldLight,fontFamily:FH}}>{convRate}%</div>
              <div style={{fontSize:11,color:C.textMuted,marginTop:4}}>Calls → Closed Deals</div>
            </Card>
          </div>
        </div>
        <HelpButton pageId="dashboard"/>
      </div>
    );
  };

  // ═══ BUYERS (SHARED) ═══
  const BuyersPage = () => {
    const [modal,setModal]=useState(null);const blank={name:"",phone:"",email:"",minAcres:"",maxAcres:"",maxPrice:"",locations:"",notes:"",active:true};const [form,setForm]=useState(blank);
    const saveBuyer=()=>{if(!form.name)return;const now=new Date().toISOString();if(modal==="new")setBuyers(p=>[{...form,id:uid(),updatedAt:now},...p]);else setBuyers(p=>p.map(b=>b.id===modal?{...b,...form,updatedAt:now}:b));setModal(null);addToast("Buyer saved");};
    const del=id=>setBuyers(p=>p.filter(b=>b.id!==id));
    return(<div><TopBar title="Buyer Management"/><div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button style={btnStyle} onClick={()=>{setForm(blank);setModal("new");}}>+ Add Buyer</button></div>
      {buyers.length===0?<EmptyState icon="♛" msg="No buyers yet. Add your first buyer." action="Add Buyer" onAction={()=>{setForm(blank);setModal("new");}}/>:<Card style={{padding:0,overflow:"hidden"}}><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:"16px 0 0 0"}}>Name</th><th style={thStyle}>Max Price</th><th style={thStyle}>Locations</th><th style={thStyle}>Status</th><th style={{...thStyle,borderRadius:"0 16px 0 0"}}>Actions</th></tr></thead><tbody>{buyers.map(b=><tr key={b.id}><td style={tdStyle}><div><span style={{fontWeight:500}}>{b.name}</span><div style={{fontSize:11,color:C.textMuted}}>{b.phone}</div></div></td><td style={tdStyle}>{fmt$(b.maxPrice)}</td><td style={tdStyle}>{b.locations||"—"}</td><td style={tdStyle}><Badge color={b.active!==false?C.green:C.red}>{b.active!==false?"Active":"Inactive"}</Badge></td><td style={tdStyle}><div style={{display:"flex",gap:6}}><button style={btnSmall} onClick={()=>{setForm(b);setModal(b.id);}}>Edit</button><button style={btnDanger} onClick={()=>del(b.id)}>Del</button></div></td></tr>)}</tbody></table></Card>}
      {modal&&<Modal title={modal==="new"?"Add Buyer":"Edit Buyer"} onClose={()=>setModal(null)}><div style={formRow}><FormField label="Name"><input style={inputStyle} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></FormField><FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Email"><input style={inputStyle} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></FormField><FormField label="Max Price"><input style={inputStyle} type="number" value={form.maxPrice} onChange={e=>setForm(p=>({...p,maxPrice:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Min Acres"><input style={inputStyle} type="number" value={form.minAcres} onChange={e=>setForm(p=>({...p,minAcres:e.target.value}))}/></FormField><FormField label="Max Acres"><input style={inputStyle} type="number" value={form.maxAcres} onChange={e=>setForm(p=>({...p,maxAcres:e.target.value}))}/></FormField></div><FormField label="Preferred Locations" full><input style={inputStyle} value={form.locations} onChange={e=>setForm(p=>({...p,locations:e.target.value}))} placeholder="Miami-Dade, Broward"/></FormField><FormField label="Notes" full><textarea style={textareaStyle} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormField><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><label style={{fontSize:12,color:C.textSec}}>Active</label><input type="checkbox" checked={form.active!==false} onChange={e=>setForm(p=>({...p,active:e.target.checked}))}/></div><button style={btnStyle} onClick={saveBuyer}>Save Buyer</button></Modal>}
      <HelpButton pageId="buyers"/>
    </div>);
  };

  // ═══ SELLERS (PERSONAL) ═══
  const SellersPage = () => {
    const [modal,setModal]=useState(null);const [importModal,setImportModal]=useState(false);const [importText,setImportText]=useState("");
    const blank={name:"",phone:"",email:"",address:"",status:"Not Called",lastContact:"",followUp:"",notes:"",buyerId:"",archived:false};
    const [form,setForm]=useState(blank);const [search,setSearch]=useState("");const [statusFilter,setStatusFilter]=useState("All");const [dupWarning,setDupWarning]=useState("");
    const checkDup=(f)=>{if(modal!=="new")return"";const match=sellers.find(s=>!s.archived&&((f.phone&&s.phone&&s.phone.trim().replace(/\D/g,"")===f.phone.trim().replace(/\D/g,""))||(f.address&&s.address&&s.address.trim().toLowerCase()===f.address.trim().toLowerCase())));return match?`A seller with this info already exists: ${match.name||match.address||match.phone}`:""};
    const saveSeller=(force)=>{if(modal==="new"&&!force){const w=checkDup(form);if(w){setDupWarning(w);return;}}const now=new Date().toISOString();if(modal==="new"){setSellers(p=>[{...form,id:uid(),updatedAt:now},...p]);addToast("Seller added");}else{setSellers(p=>p.map(l=>l.id===modal?{...l,...form,updatedAt:now}:l));addToast("Seller updated");}setModal(null);setDupWarning("");};
    const doImport=()=>{const lines=importText.trim().split("\n").filter(Boolean);const nl=lines.map(line=>{const p=line.split(/[,\t]+/).map(s=>s.trim());return{id:uid(),name:p[0]||"",address:p[1]||"",phone:p[2]||"",email:p[3]||"",status:"Not Called",lastContact:"",followUp:"",notes:"",buyerId:"",archived:false,updatedAt:new Date().toISOString()};});setSellers(p=>[...nl,...p]);setImportText("");setImportModal(false);addToast(`Imported ${nl.length} sellers`);};
    const inlineStatus=(id,newStatus)=>{setSellers(p=>p.map(l=>l.id===id?{...l,status:newStatus,lastContact:todayStr(),updatedAt:new Date().toISOString()}:l));};
    const logCallFor=(id)=>{setPrefillCallId(id);setPage("calls");};
    const active=sellers.filter(l=>!l.archived);
    const filtered=active.filter(l=>{const q=search.toLowerCase();const matchSearch=!q||(l.name||"").toLowerCase().includes(q)||(l.address||"").toLowerCase().includes(q)||(l.phone||"").includes(q);const matchStatus=statusFilter==="All"||l.status===statusFilter;return matchSearch&&matchStatus;});
    const daysSince=(d)=>{if(!d)return null;return Math.floor((Date.now()-new Date(d+"T00:00:00"))/864e5);};
    return(<div><TopBar title="Seller Management"/><div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:18,flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:8,flex:1,minWidth:200}}>
        <input style={{...inputStyle,maxWidth:280}} placeholder="Search name, address, phone..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{...selectStyle,maxWidth:160}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="All">All Statuses</option>{CALL_STATUSES.map(s=><option key={s}>{s}</option>)}</select>
      </div>
      <div style={{display:"flex",gap:8}}><button style={btnOutline} onClick={()=>setImportModal(true)}>Import</button><button style={btnStyle} onClick={()=>{setForm(blank);setDupWarning("");setModal("new");}}>+ Add Seller</button></div>
    </div>
      <div style={{fontSize:12,color:C.textMuted,marginBottom:12}}>{filtered.length} of {active.length} sellers</div>
      {active.length===0?<EmptyState icon="◇" msg="No sellers yet. Add or import sellers." action="Add Seller" onAction={()=>{setForm(blank);setModal("new");}}/>:<Card style={{padding:0,overflow:"hidden"}}><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:"16px 0 0 0"}}>Name</th><th style={thStyle}>Address</th><th style={thStyle}>Status</th><th style={thStyle}>Last Contact</th><th style={thStyle}>Follow-Up</th><th style={{...thStyle,borderRadius:"0 16px 0 0"}}>Actions</th></tr></thead><tbody>{filtered.map(l=>{const days=daysSince(l.lastContact);return(<tr key={l.id}><td style={tdStyle}><div><span style={{fontWeight:500}}>{l.name||"Unknown"}</span>{l.phone&&<div><a href={`tel:${l.phone}`} style={{fontSize:11,color:C.gold,textDecoration:"none"}}>{l.phone}</a></div>}</div></td><td style={tdStyle}>{l.address||"—"}</td><td style={tdStyle}><select value={l.status} onChange={e=>inlineStatus(l.id,e.target.value)} style={{background:"transparent",border:"none",color:STATUS_COLORS[l.status]||C.text,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer",outline:"none"}}>{CALL_STATUSES.map(s=><option key={s} style={{background:C.bgCard,color:C.text}}>{s}</option>)}</select></td><td style={tdStyle}><span style={{fontSize:12,color:days===null?C.textMuted:days>30?C.red:days>14?C.orange:C.textSec}}>{days===null?"Never":`${days}d ago`}</span></td><td style={tdStyle}>{fmtDate(l.followUp)}</td><td style={tdStyle}><div style={{display:"flex",gap:5}}><button style={{...btnSmall,padding:"5px 10px",fontSize:11}} onClick={()=>logCallFor(l.id)}>Call</button><button style={{...btnSmall,padding:"5px 10px",fontSize:11}} onClick={()=>{setForm(l);setDupWarning("");setModal(l.id);}}>Edit</button><button style={{...btnDanger,padding:"5px 10px",fontSize:11}} onClick={()=>{setSellers(p=>p.map(x=>x.id===l.id?{...x,archived:true}:x));addToast("Seller archived");}}>Arc</button></div></td></tr>);})}</tbody></table></Card>}
      {modal&&<Modal title={modal==="new"?"Add Seller":"Edit Seller"} onClose={()=>{setModal(null);setDupWarning("");}}>
        {dupWarning&&<div style={{padding:"10px 14px",background:"rgba(255,149,0,0.1)",border:`1px solid ${C.orange}40`,borderRadius:10,marginBottom:14,fontSize:13,color:C.orange}}>{dupWarning}</div>}
        <div style={formRow}><FormField label="Name"><input style={inputStyle} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></FormField><FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></FormField></div><FormField label="Address" full><input style={inputStyle} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></FormField><div style={formRow}><FormField label="Email"><input style={inputStyle} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></FormField><FormField label="Status"><select style={selectStyle} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{CALL_STATUSES.map(s=><option key={s}>{s}</option>)}</select></FormField></div><div style={formRow}><FormField label="Last Contact"><input style={inputStyle} type="date" value={form.lastContact} onChange={e=>setForm(p=>({...p,lastContact:e.target.value}))}/></FormField><FormField label="Follow-Up"><input style={inputStyle} type="date" value={form.followUp} onChange={e=>setForm(p=>({...p,followUp:e.target.value}))}/></FormField></div><FormField label="Link to Buyer" full><select style={selectStyle} value={form.buyerId} onChange={e=>setForm(p=>({...p,buyerId:e.target.value}))}><option value="">— None —</option>{activeBuyers.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></FormField><FormField label="Notes" full><textarea style={textareaStyle} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormField>
        <div style={{display:"flex",gap:10}}><button style={btnStyle} onClick={()=>saveSeller(false)}>Save Seller</button>{dupWarning&&<button style={btnOutline} onClick={()=>saveSeller(true)}>Save Anyway</button>}</div>
      </Modal>}
      {importModal&&<Modal title="Import ProStream Data" onClose={()=>setImportModal(false)}><p style={{fontSize:13,color:C.textSec,marginBottom:12}}>Paste: Name, Address, Phone, Email (one per line)</p><textarea style={{...textareaStyle,minHeight:160}} value={importText} onChange={e=>setImportText(e.target.value)} placeholder={"John Doe, 123 Main St, 555-1234, john@email.com"}/><button style={{...btnStyle,marginTop:12}} onClick={doImport}>Import Sellers</button></Modal>}
      <HelpButton pageId="sellers"/>
    </div>);
  };

  // ═══ CALL TRACKER (PERSONAL) ═══
  const CallsPage = () => {
    const [modal,setModal]=useState(!!prefillCallId);const [form,setForm]=useState({leadId:prefillCallId||"",date:todayStr(),time:new Date().toLocaleTimeString("en-US",{hour12:false,hour:"2-digit",minute:"2-digit"}),result:"Answered",notes:"",followUp:"",discussed:""});
    useEffect(()=>{if(prefillCallId){setForm(p=>({...p,leadId:prefillCallId}));setModal(true);setPrefillCallId("");}},[]);
    const RESULT_MAP={"Interested":"Interested","Voicemail":"Voicemail","Rejected":"Not Interested","Not Interested":"Not Interested","Answered":"Called"};
    const saveCall=()=>{const nc={...form,id:uid(),updatedAt:new Date().toISOString()};setCalls(p=>[nc,...p]);if(form.leadId){const newStatus=RESULT_MAP[form.result]||"Called";setSellers(p=>p.map(l=>l.id===form.leadId?{...l,status:newStatus,lastContact:form.date,updatedAt:new Date().toISOString(),...(form.followUp?{followUp:form.followUp}:{})}:l));}setModal(false);addToast("Call logged");};
    return(<div><TopBar title="Call Tracker"/><div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button style={btnStyle} onClick={()=>{setForm({leadId:"",date:todayStr(),time:new Date().toLocaleTimeString("en-US",{hour12:false,hour:"2-digit",minute:"2-digit"}),result:"Answered",notes:"",followUp:"",discussed:""});setModal(true);}}>+ Log Call</button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14,marginBottom:22}}>{[{v:calls.length,l:"Total Calls",c:C.blue},{v:weekCalls.length,l:"This Week",c:C.orange},{v:calls.filter(c=>c.result==="Interested").length,l:"Interested",c:C.green}].map((s,i)=>(<Card key={i} style={{padding:18,textAlign:"center"}}><div style={{fontSize:28,fontWeight:400,color:s.c,fontFamily:FH}}>{s.v}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>{s.l}</div></Card>))}</div>
      {calls.length===0?<EmptyState icon="◇" msg="No calls logged yet."/>:<Card style={{padding:0,overflow:"hidden"}}><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:"16px 0 0 0"}}>Seller</th><th style={thStyle}>Date</th><th style={thStyle}>Time</th><th style={thStyle}>Result</th><th style={{...thStyle,borderRadius:"0 16px 0 0"}}>Notes</th></tr></thead><tbody>{calls.slice(0,30).map(c=>{const l=sellers.find(x=>x.id===c.leadId);return(<tr key={c.id}><td style={tdStyle}>{l?l.name||l.address||l.phone:"—"}</td><td style={tdStyle}>{fmtDate(c.date)}</td><td style={tdStyle}>{c.time||"—"}</td><td style={tdStyle}><Badge color={STATUS_COLORS[c.result]}>{c.result}</Badge></td><td style={tdStyle}><span style={{fontSize:12,color:C.textMuted}}>{c.discussed||c.notes||"—"}</span></td></tr>);})}</tbody></table></Card>}
      {modal&&<Modal title="Log Call" onClose={()=>setModal(false)}><FormField label="Seller" full><select style={selectStyle} value={form.leadId} onChange={e=>setForm(p=>({...p,leadId:e.target.value}))}><option value="">— Select Seller —</option>{sellers.map(l=><option key={l.id} value={l.id}>{l.name||l.address||l.phone}</option>)}</select></FormField><div style={formRow}><FormField label="Date"><input style={inputStyle} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></FormField><FormField label="Time"><input style={inputStyle} type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Result"><select style={selectStyle} value={form.result} onChange={e=>setForm(p=>({...p,result:e.target.value}))}>{["Answered","Voicemail","Rejected","Interested","Not Interested"].map(s=><option key={s}>{s}</option>)}</select></FormField><FormField label="Follow-Up"><input style={inputStyle} type="date" value={form.followUp} onChange={e=>setForm(p=>({...p,followUp:e.target.value}))}/></FormField></div><FormField label="What Was Discussed" full><textarea style={textareaStyle} value={form.discussed} onChange={e=>setForm(p=>({...p,discussed:e.target.value}))}/></FormField><FormField label="Notes / Objections" full><textarea style={textareaStyle} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormField><button style={btnStyle} onClick={saveCall}>Save Call</button></Modal>}
      <HelpButton pageId="calls"/>
    </div>);
  };

  // ═══ DEAL ANALYZER ═══
  const AnalyzerPage = () => {
    const [f,setF]=useState({acres:"",fmv:"",buyerPrice:"",offerPct:60});const offerPrice=Number(f.fmv||0)*(f.offerPct/100);const actualProfit=Number(f.buyerPrice||0)-offerPrice;const buyerSavings=Number(f.fmv||0)-Number(f.buyerPrice||0);
    const saveToPipeline=()=>{if(!f.fmv)return;setDeals(p=>[{id:uid(),address:"",acres:f.acres,fmv:f.fmv,offerPrice:offerPrice.toFixed(0),buyerPrice:f.buyerPrice,profit:actualProfit.toFixed(0),status:"Prospect",buyerId:"",dateEntered:todayStr(),targetClose:"",notes:""},...p]);setPage("pipeline");};
    return(<div><TopBar title="Deal Analyzer"/><div className="dash-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      <Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:18}}>Input</div><div style={formRow}><FormField label="Acres"><input style={inputStyle} type="number" value={f.acres} onChange={e=>setF(p=>({...p,acres:e.target.value}))}/></FormField><FormField label="Fair Market Value"><input style={inputStyle} type="number" value={f.fmv} onChange={e=>setF(p=>({...p,fmv:e.target.value}))}/></FormField></div><FormField label="Buyer Price" full><input style={inputStyle} type="number" value={f.buyerPrice} onChange={e=>setF(p=>({...p,buyerPrice:e.target.value}))}/></FormField><FormField label={`Offer % of FMV: ${f.offerPct}%`} full><input type="range" min="30" max="90" value={f.offerPct} onChange={e=>setF(p=>({...p,offerPct:Number(e.target.value)}))} style={{width:"100%",accentColor:C.gold}}/></FormField></Card>
      <Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:18}}>Output</div><div style={{display:"grid",gap:22}}><div><div style={{fontSize:11,color:C.textSec,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Recommended Offer</div><div style={{fontSize:32,fontWeight:400,color:C.goldLight,fontFamily:FH}}>{fmt$(offerPrice)}</div></div><div><div style={{fontSize:11,color:C.textSec,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Your Profit</div><div style={{fontSize:32,fontWeight:400,color:actualProfit>0?C.green:C.red,fontFamily:FH}}>{fmt$(actualProfit)}</div></div><div><div style={{fontSize:11,color:C.textSec,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Buyer Savings vs FMV</div><div style={{fontSize:22,color:C.text}}>{fmt$(Math.abs(buyerSavings))}</div></div>{f.acres&&f.fmv&&<div><div style={{fontSize:11,color:C.textSec,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Price/Acre</div><div style={{fontSize:18,color:C.textSec}}>{fmt$(Number(f.fmv)/Number(f.acres))}/ac</div></div>}</div><button style={{...btnStyle,marginTop:24,width:"100%"}} onClick={saveToPipeline}>Save to Pipeline</button></Card>
    </div><HelpButton pageId="analyzer"/></div>);
  };

  // ═══ DEAL PIPELINE (PERSONAL) ═══
  const PipelinePage = () => {
    const [modal,setModal]=useState(null);const blank={address:"",acres:"",fmv:"",offerPrice:"",buyerPrice:"",profit:"",status:"Prospect",buyerId:"",dateEntered:todayStr(),targetClose:"",notes:""};const [form,setForm]=useState(blank);const [filter,setFilter]=useState("All");
    const saveDeal=()=>{const now=new Date().toISOString();const d={...form,profit:(Number(form.buyerPrice||0)-Number(form.offerPrice||0)).toString(),updatedAt:now};if(modal==="new")setDeals(p=>[{...d,id:uid()},...p]);else setDeals(p=>p.map(x=>x.id===modal?{...x,...d}:x));setModal(null);addToast("Deal saved");};
    const del=id=>setDeals(p=>p.filter(d=>d.id!==id));const filtered=filter==="All"?deals:deals.filter(d=>d.status===filter);
    return(<div><TopBar title="Deal Pipeline"/><div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button style={btnStyle} onClick={()=>{setForm(blank);setModal("new");}}>+ Add Deal</button></div>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>{["All",...DEAL_STATUSES].map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:"7px 18px",borderRadius:10,border:`1px solid ${filter===s?C.gold:C.goldBorder}`,background:filter===s?"rgba(212,175,55,0.1)":"transparent",color:filter===s?C.gold:C.textSec,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>)}</div>
      {filtered.length===0?<EmptyState icon="◇" msg="No deals in pipeline."/>:<Card style={{padding:0,overflow:"hidden"}}><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:"16px 0 0 0"}}>Property</th><th style={thStyle}>Offer</th><th style={thStyle}>Buyer $</th><th style={thStyle}>Profit</th><th style={thStyle}>Status</th><th style={{...thStyle,borderRadius:"0 16px 0 0"}}>Actions</th></tr></thead><tbody>{filtered.map(d=><tr key={d.id}><td style={tdStyle}><div><span style={{fontWeight:500}}>{d.address||"—"}</span>{d.acres&&<div style={{fontSize:11,color:C.textMuted}}>{d.acres} ac</div>}</div></td><td style={tdStyle}>{fmt$(d.offerPrice)}</td><td style={tdStyle}>{fmt$(d.buyerPrice)}</td><td style={tdStyle}><span style={{color:Number(d.profit)>0?C.green:C.red,fontWeight:600}}>{fmt$(d.profit)}</span></td><td style={tdStyle}><Badge color={STATUS_COLORS[d.status]}>{d.status}</Badge></td><td style={tdStyle}><div style={{display:"flex",gap:6}}><button style={btnSmall} onClick={()=>{setForm(d);setModal(d.id);}}>Edit</button><button style={btnDanger} onClick={()=>del(d.id)}>Del</button></div></td></tr>)}</tbody></table></Card>}
      {modal&&<Modal title={modal==="new"?"Add Deal":"Edit Deal"} onClose={()=>setModal(null)}><FormField label="Property Address" full><input style={inputStyle} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></FormField><div style={formRow}><FormField label="Acres"><input style={inputStyle} type="number" value={form.acres} onChange={e=>setForm(p=>({...p,acres:e.target.value}))}/></FormField><FormField label="FMV"><input style={inputStyle} type="number" value={form.fmv} onChange={e=>setForm(p=>({...p,fmv:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Your Offer"><input style={inputStyle} type="number" value={form.offerPrice} onChange={e=>setForm(p=>({...p,offerPrice:e.target.value}))}/></FormField><FormField label="Buyer Price"><input style={inputStyle} type="number" value={form.buyerPrice} onChange={e=>setForm(p=>({...p,buyerPrice:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Status"><select style={selectStyle} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{DEAL_STATUSES.map(s=><option key={s}>{s}</option>)}</select></FormField><FormField label="Buyer"><select style={selectStyle} value={form.buyerId} onChange={e=>setForm(p=>({...p,buyerId:e.target.value}))}><option value="">— None —</option>{activeBuyers.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></FormField></div><div style={formRow}><FormField label="Date Entered"><input style={inputStyle} type="date" value={form.dateEntered} onChange={e=>setForm(p=>({...p,dateEntered:e.target.value}))}/></FormField><FormField label="Target Close"><input style={inputStyle} type="date" value={form.targetClose} onChange={e=>setForm(p=>({...p,targetClose:e.target.value}))}/></FormField></div><FormField label="Notes" full><textarea style={textareaStyle} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormField><button style={btnStyle} onClick={saveDeal}>Save Deal</button></Modal>}
      <HelpButton pageId="pipeline"/>
    </div>);
  };

  // ═══ TEMPLATES (SHARED) ═══
  const TemplatesPage = () => {
    const [copied,setCopied]=useState(null);const copy=k=>{navigator.clipboard.writeText(TEMPLATES[k].content).catch(()=>{});setCopied(k);setTimeout(()=>setCopied(null),2000);};
    return(<div><TopBar title="Outreach Templates"/>{Object.entries(TEMPLATES).map(([k,t])=>(<Card key={k} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:15,color:C.goldLight,fontWeight:500,fontFamily:FH}}>{t.title}</div><button style={btnStyle} onClick={()=>copy(k)}>{copied===k?"✓ Copied":"Copy"}</button></div><pre style={{whiteSpace:"pre-wrap",fontSize:13,color:C.textSec,lineHeight:1.7,margin:0,fontFamily:"inherit"}}>{t.content}</pre></Card>))}<HelpButton pageId="templates"/></div>);
  };

  // ═══ METRICS (PERSONAL) ═══
  const MetricsPage = () => {
    const conv=calls.length?((closedDeals.length/calls.length)*100).toFixed(1):"0";const avg=closedDeals.length?totalProfit/closedDeals.length:0;const pbb={};closedDeals.forEach(d=>{const b=buyers.find(x=>x.id===d.buyerId);const n=b?b.name:"Unlinked";pbb[n]=(pbb[n]||0)+Number(d.profit||0);});
    return(<div><TopBar title="Performance Metrics"/><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14,marginBottom:22}}>{[{v:calls.length,l:"Total Calls"},{v:conv+"%",l:"Conversion"},{v:fmt$(avg),l:"Avg Profit"},{v:fmt$(pipelineProfit),l:"Pipeline Profit"},{v:closedDeals.length,l:"Closed"},{v:fmt$(totalRevenue),l:"Revenue"},{v:fmt$(totalProfit),l:"Profit YTD"},{v:weekCalls.length,l:"This Week"}].map((s,i)=>(<Card key={i} style={{padding:18,textAlign:"center"}}><div style={{fontSize:26,fontWeight:400,color:C.goldLight,fontFamily:FH}}>{s.v}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>{s.l}</div></Card>))}</div>{Object.keys(pbb).length>0&&<Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Profit by Buyer</div>{Object.entries(pbb).sort((a,b)=>b[1]-a[1]).map(([n,p])=><div key={n} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${C.goldBorder}`}}><span>{n}</span><span style={{color:C.goldLight,fontWeight:600}}>{fmt$(p)}</span></div>)}</Card>}<HelpButton pageId="metrics"/></div>);
  };

  // ═══ BUYER MATCHING ═══
  const MatchingPage = () => {
    const getMatches=l=>activeBuyers.map(b=>{let s=0;if(l.address&&b.locations){const locs=b.locations.toLowerCase().split(",").map(x=>x.trim());if(locs.some(loc=>l.address.toLowerCase().includes(loc)))s+=3;}return{buyer:b,score:s};}).filter(m=>m.score>0).sort((a,b)=>b.score-a.score);
    const lm=sellers.filter(l=>!l.archived).map(l=>({seller:l,matches:getMatches(l)})).filter(x=>x.matches.length>0);
    return(<div><TopBar title="Buyer Matching"/>{activeBuyers.length===0?<EmptyState icon="♛" msg="Add buyers with location preferences first."/>:lm.length===0?<EmptyState icon="⚯" msg="No matches found. Ensure buyer locations overlap seller addresses."/>:lm.map(({seller,matches})=>(<Card key={seller.id} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div><span style={{fontWeight:500}}>{seller.name||"Unknown"}</span><span style={{color:C.textMuted,fontSize:12,marginLeft:10}}>{seller.address}</span></div><Badge color={STATUS_COLORS[seller.status]}>{seller.status}</Badge></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{matches.map((m,i)=>(<Badge key={m.buyer.id} color={i===0?C.green:C.gold}>{i===0?"★ ":""}{m.buyer.name} — max {fmt$(m.buyer.maxPrice)}</Badge>))}</div></Card>))}<HelpButton pageId="matching"/></div>);
  };

  // ═══ FINANCIAL (PERSONAL) ═══
  const FinancialPage = () => {
    const avg=closedDeals.length?totalProfit/closedDeals.length:0;const cpa=closedDeals.length&&calls.length?(calls.length/closedDeals.length).toFixed(1):"—";const pbb={};closedDeals.forEach(d=>{const b=buyers.find(x=>x.id===d.buyerId);const n=b?b.name:"Unlinked";pbb[n]=(pbb[n]||0)+Number(d.profit||0);});
    return(<div><TopBar title="Financial Tracking"/><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:22}}>{[{v:fmt$(totalRevenue),l:"Total Revenue",c:C.green},{v:fmt$(totalProfit),l:"Profit YTD",c:C.goldLight},{v:fmt$(avg),l:"Avg Profit/Deal",c:C.blue},{v:cpa,l:"Calls per Deal",c:C.orange}].map((s,i)=>(<Card key={i} style={{padding:20,textAlign:"center"}}><div style={{fontSize:28,fontWeight:400,color:s.c,fontFamily:FH}}>{s.v}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>{s.l}</div></Card>))}</div>{Object.keys(pbb).length>0&&<Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Profit by Buyer</div>{Object.entries(pbb).sort((a,b)=>b[1]-a[1]).map(([n,p])=><div key={n} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${C.goldBorder}`}}><span>{n}</span><span style={{color:C.goldLight,fontSize:18,fontWeight:600}}>{fmt$(p)}</span></div>)}</Card>}<HelpButton pageId="financial"/></div>);
  };

  // ═══ CALENDAR (PERSONAL) ═══
  const CalendarPage = () => {
    const t=todayStr();const allFU=sellers.filter(l=>l.followUp&&!l.archived).sort((a,b)=>a.followUp.localeCompare(b.followUp));
    const overdue=allFU.filter(l=>l.followUp<t);const todayFU=allFU.filter(l=>l.followUp===t);
    const thisWeek=allFU.filter(l=>{const d=new Date(l.followUp);const now=new Date();return l.followUp>t&&d<=new Date(now.getTime()+7*864e5);});
    const markCalled=id=>{setSellers(p=>p.map(l=>l.id===id?{...l,status:"Called",lastContact:t,updatedAt:new Date().toISOString()}:l));addToast("Marked as called");};
    const Section=({title,items,color,empty})=>(<Card style={{marginBottom:14,...(color?{borderLeft:`3px solid ${color}`}:{})}}><div style={{fontSize:16,color:color||C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>{title} ({items.length})</div>{items.length===0?<p style={{color:C.textMuted,fontSize:13}}>{empty}</p>:items.map(l=>(<div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.goldBorder}`}}><div><span style={{fontWeight:500}}>{l.name||"Unknown"}</span><span style={{color:C.textMuted,fontSize:12,marginLeft:10}}>{l.address} — {fmtDate(l.followUp)}</span></div><button style={btnSmall} onClick={()=>markCalled(l.id)}>Mark Called</button></div>))}</Card>);
    return(<div><TopBar title="Calendar / Tasks"/><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14,marginBottom:22}}><Card style={{padding:18,textAlign:"center"}}><div style={{fontSize:28,fontWeight:400,color:C.red,fontFamily:FH}}>{overdue.length}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>Overdue</div></Card><Card style={{padding:18,textAlign:"center"}}><div style={{fontSize:28,fontWeight:400,color:C.orange,fontFamily:FH}}>{todayFU.length}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>Due Today</div></Card><Card style={{padding:18,textAlign:"center"}}><div style={{fontSize:28,fontWeight:400,color:C.blue,fontFamily:FH}}>{thisWeek.length}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>This Week</div></Card></div>
      {overdue.length>0&&<Section title="Overdue" items={overdue} color={C.red} empty=""/>}
      <Section title="Due Today" items={todayFU} color={C.orange} empty="No follow-ups due today."/>
      <Section title="This Week" items={thisWeek} color={C.blue} empty="Nothing scheduled this week."/>
      <HelpButton pageId="calendar"/></div>);
  };

  // ═══ VELOCITY ═══
  const VelocityPage = () => {
    const sc={};DEAL_STATUSES.forEach(s=>sc[s]=deals.filter(d=>d.status===s).length);const total=deals.length||1;const conv=DEAL_STATUSES.map((s,i)=>({stage:s,count:sc[s],rate:i===0?"—":sc[DEAL_STATUSES[i-1]]?(sc[s]/sc[DEAL_STATUSES[i-1]]*100).toFixed(0)+"%":"—"}));
    return(<div><TopBar title="Pipeline Velocity"/><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:14,marginBottom:22}}>{DEAL_STATUSES.map(s=><Card key={s} style={{padding:18,textAlign:"center"}}><div style={{fontSize:26,fontWeight:400,color:STATUS_COLORS[s],fontFamily:FH}}>{sc[s]}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>{s}</div></Card>)}</div><Card style={{padding:0,overflow:"hidden"}}><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:"16px 0 0 0"}}>Stage</th><th style={thStyle}>Deals</th><th style={thStyle}>Conversion</th><th style={{...thStyle,borderRadius:"0 16px 0 0"}}>Progress</th></tr></thead><tbody>{conv.map(c=><tr key={c.stage}><td style={tdStyle}><Badge color={STATUS_COLORS[c.stage]}>{c.stage}</Badge></td><td style={tdStyle}>{c.count}</td><td style={tdStyle}>{c.rate}</td><td style={tdStyle}><div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.04)",width:"100%"}}><div style={{height:6,borderRadius:3,background:STATUS_COLORS[c.stage],width:(c.count/total*100)+"%"}}/></div></td></tr>)}</tbody></table></Card>{deals.filter(d=>d.status!=="Closed"&&d.dateEntered).length>0&&<Card style={{marginTop:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Active Deal Age</div>{deals.filter(d=>d.status!=="Closed"&&d.dateEntered).map(d=>{const days=Math.floor((Date.now()-new Date(d.dateEntered))/864e5);return<div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.goldBorder}`}}><span>{d.address}</span><span style={{color:days>30?C.red:days>14?C.orange:C.green}}>{days}d <Badge color={STATUS_COLORS[d.status]}>{d.status}</Badge></span></div>;})}</Card>}<HelpButton pageId="velocity"/></div>);
  };

  // ═══ MARKET (SHARED) ═══
  const MarketPage = () => {
    const [modal,setModal]=useState(false);const [form,setForm]=useState({area:"",avgPrice:"",pricePerAcre:"",dealCount:"",date:todayStr(),notes:""});const saveM=()=>{if(!form.area)return;setMarketData(p=>[{...form,id:uid()},...p]);setModal(false);};const byArea={};marketData.forEach(m=>{if(!byArea[m.area])byArea[m.area]=[];byArea[m.area].push(m);});
    return(<div><TopBar title="Market Analysis"/><div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button style={btnStyle} onClick={()=>{setForm({area:"",avgPrice:"",pricePerAcre:"",dealCount:"",date:todayStr(),notes:""});setModal(true);}}>+ Add Data</button></div>{marketData.length===0?<EmptyState icon="▤" msg="No market data yet."/>:Object.entries(byArea).map(([area,entries])=>(<Card key={area} style={{marginBottom:14,padding:0,overflow:"hidden"}}><div style={{padding:"18px 22px",fontSize:15,fontWeight:500,color:C.goldLight,fontFamily:FH}}>{area}</div><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:0}}>Date</th><th style={thStyle}>Avg Price</th><th style={thStyle}>$/Acre</th><th style={thStyle}>Deals</th><th style={thStyle}>Notes</th></tr></thead><tbody>{entries.sort((a,b)=>b.date.localeCompare(a.date)).map(m=><tr key={m.id}><td style={tdStyle}>{fmtDate(m.date)}</td><td style={tdStyle}>{fmt$(m.avgPrice)}</td><td style={tdStyle}>{fmt$(m.pricePerAcre)}</td><td style={tdStyle}>{m.dealCount||"—"}</td><td style={tdStyle}>{m.notes||"—"}</td></tr>)}</tbody></table></Card>))}{modal&&<Modal title="Add Market Data" onClose={()=>setModal(false)}><div style={formRow}><FormField label="Target Area"><input style={inputStyle} value={form.area} onChange={e=>setForm(p=>({...p,area:e.target.value}))} placeholder="Broward County"/></FormField><FormField label="Date"><input style={inputStyle} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Avg Price"><input style={inputStyle} type="number" value={form.avgPrice} onChange={e=>setForm(p=>({...p,avgPrice:e.target.value}))}/></FormField><FormField label="Price/Acre"><input style={inputStyle} type="number" value={form.pricePerAcre} onChange={e=>setForm(p=>({...p,pricePerAcre:e.target.value}))}/></FormField></div><FormField label="Deal Count" full><input style={inputStyle} type="number" value={form.dealCount} onChange={e=>setForm(p=>({...p,dealCount:e.target.value}))}/></FormField><FormField label="Notes" full><textarea style={textareaStyle} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormField><button style={btnStyle} onClick={saveM}>Save</button></Modal>}<HelpButton pageId="market"/></div>);
  };

  // ═══ FEEDBACK (PERSONAL) ═══
  const FeedbackPage = () => {
    const [modal,setModal]=useState(false);const [form,setForm]=useState({dealId:"",outcome:"Won",lessons:"",scriptUsed:"",effectiveness:"",postMortem:""});const saveF=()=>{setFeedback(p=>[{...form,id:uid(),date:todayStr()},...p]);setModal(false);};
    return(<div><TopBar title="Feedback Loop"/><div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button style={btnStyle} onClick={()=>{setForm({dealId:"",outcome:"Won",lessons:"",scriptUsed:"",effectiveness:"",postMortem:""});setModal(true);}}>+ Add Entry</button></div>{feedback.length===0?<EmptyState icon="✎" msg="No feedback entries yet."/>:feedback.map(f=>{const deal=deals.find(d=>d.id===f.dealId);return(<Card key={f.id} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:C.goldLight}}>{deal?deal.address:"General"}</span><span style={{color:C.textMuted,fontSize:12}}>{fmtDateFull(f.date)}</span></div><Badge color={f.outcome==="Won"?C.green:C.red}>{f.outcome}</Badge>{f.lessons&&<p style={{color:C.textSec,fontSize:13,marginTop:8}}>Lessons: {f.lessons}</p>}{f.scriptUsed&&<p style={{color:C.textSec,fontSize:13}}>Script: {f.scriptUsed} — Effectiveness: {f.effectiveness||"N/A"}</p>}{f.postMortem&&<p style={{color:C.textSec,fontSize:13}}>Post-Mortem: {f.postMortem}</p>}</Card>);})}{modal&&<Modal title="Add Feedback" onClose={()=>setModal(false)}><FormField label="Linked Deal" full><select style={selectStyle} value={form.dealId} onChange={e=>setForm(p=>({...p,dealId:e.target.value}))}><option value="">— General —</option>{deals.map(d=><option key={d.id} value={d.id}>{d.address}</option>)}</select></FormField><FormField label="Outcome" full><select style={selectStyle} value={form.outcome} onChange={e=>setForm(p=>({...p,outcome:e.target.value}))}><option>Won</option><option>Lost</option><option>Stalled</option></select></FormField><FormField label="Lessons Learned" full><textarea style={textareaStyle} value={form.lessons} onChange={e=>setForm(p=>({...p,lessons:e.target.value}))}/></FormField><div style={formRow}><FormField label="Script Used"><input style={inputStyle} value={form.scriptUsed} onChange={e=>setForm(p=>({...p,scriptUsed:e.target.value}))}/></FormField><FormField label="Effectiveness (1-10)"><input style={inputStyle} value={form.effectiveness} onChange={e=>setForm(p=>({...p,effectiveness:e.target.value}))}/></FormField></div><FormField label="Post-Mortem" full><textarea style={textareaStyle} value={form.postMortem} onChange={e=>setForm(p=>({...p,postMortem:e.target.value}))}/></FormField><button style={btnStyle} onClick={saveF}>Save</button></Modal>}<HelpButton pageId="feedback"/></div>);
  };

  // ═══ BULK OPS (PERSONAL) ═══
  const BulkPage = () => {
    const [importText,setImportText]=useState("");const [result,setResult]=useState("");
    const bulkImport=()=>{const lines=importText.trim().split("\n").filter(Boolean);const nl=lines.map(line=>{const p=line.split(/[,\t]+/).map(s=>s.trim());return{id:uid(),name:p[0]||"",address:p[1]||"",phone:p[2]||"",email:p[3]||"",status:"Not Called",lastContact:"",followUp:"",notes:"",buyerId:"",archived:false};});setSellers(p=>[...p,...nl]);setResult(`Imported ${nl.length} sellers.`);setImportText("");};
    const bulkFU=()=>{const d=new Date();d.setDate(d.getDate()+3);const fd=d.toISOString().split("T")[0];let c=0;setSellers(p=>p.map(l=>{if(!l.archived&&["Called","Voicemail","Interested"].includes(l.status)&&!l.followUp){c++;return{...l,followUp:fd};}return l;}));setResult(`Scheduled ${c} follow-ups for ${fmtDate(fd)}.`);};
    return(<div><TopBar title="Bulk Operations"/><Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Bulk Import</div><p style={{fontSize:13,color:C.textSec,marginBottom:12}}>Name, Address, Phone, Email (one per line)</p><textarea style={{...textareaStyle,minHeight:120}} value={importText} onChange={e=>setImportText(e.target.value)}/><button style={{...btnStyle,marginTop:12}} onClick={bulkImport}>Import All</button></Card><Card style={{marginTop:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Bulk Actions</div><button style={btnStyle} onClick={bulkFU}>Schedule Follow-Ups (3 days)</button></Card>{result&&<Card style={{marginTop:14,borderColor:C.green+"35"}}><p style={{color:C.green,margin:0}}>{result}</p></Card>}<HelpButton pageId="bulk"/></div>);
  };

  // ═══ DATA MANAGEMENT ═══
  const DataPage = () => {
    const [confirm,setConfirm]=useState(false);const exportCSV=(data,fn,headers)=>{const csv=[headers.join(","),...data.map(r=>headers.map(h=>JSON.stringify(r[h]||"")).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=fn;a.click();};
    const clearAll=()=>{setBuyers([]);setSellers([]);setCalls([]);setDeals([]);setFeedback([]);setMarketData([]);setConfirm(false);};
    return(<div><TopBar title="Data Management"/><Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Export Data</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button style={btnStyle} onClick={()=>exportCSV(buyers,"buyers.csv",["name","phone","email","minAcres","maxAcres","maxPrice","locations","notes"])}>Buyers</button><button style={btnStyle} onClick={()=>exportCSV(sellers,"sellers.csv",["name","address","phone","email","status","lastContact","followUp","notes"])}>Sellers</button><button style={btnStyle} onClick={()=>exportCSV(calls,"calls.csv",["date","time","leadId","result","discussed","notes","followUp"])}>Calls</button><button style={btnStyle} onClick={()=>exportCSV(deals,"deals.csv",["address","acres","fmv","offerPrice","buyerPrice","profit","status","dateEntered","targetClose","notes"])}>Pipeline</button></div></Card><Card style={{marginTop:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Storage ({profile})</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>{[["Buyers",buyers],["Sellers",sellers],["Calls",calls],["Deals",deals],["Feedback",feedback],["Market",marketData]].map(([n,d])=>(<div key={n}><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase"}}>{n}</div><div style={{fontSize:20,color:C.text,fontWeight:300,marginTop:2}}>{d.length}</div></div>))}</div></Card><Card style={{marginTop:14,borderColor:"rgba(229,57,53,0.25)"}}><div style={{fontSize:16,color:C.red,fontWeight:500,fontFamily:FH,marginBottom:14}}>Danger Zone</div>{!confirm?<button style={btnDanger} onClick={()=>setConfirm(true)}>Clear All Data</button>:(<div><p style={{color:C.red,fontSize:13,marginBottom:12}}>Permanently delete ALL data for {profile}?</p><div style={{display:"flex",gap:10}}><button style={{...btnDanger,padding:"10px 24px"}} onClick={clearAll}>Yes, Delete Everything</button><button style={btnOutline} onClick={()=>setConfirm(false)}>Cancel</button></div></div>)}</Card><HelpButton pageId="data"/></div>);
  };

  // ═══ MAP PAGE ═══
  const MapPage = () => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersLayer = useRef(null);
    const initDone = useRef(false);
    const [showBuyers, setShowBuyers] = useState(true);
    const [showArchived, setShowArchived] = useState(false);
    const [statusFilters, setStatusFilters] = useState(()=>{const o={};CALL_STATUSES.forEach(s=>o[s]=true);return o;});
    const [leafletReady, setLeafletReady] = useState(!!window.L);

    // Load Leaflet
    useEffect(()=>{
      if(window.L){setLeafletReady(true);return;}
      const css=document.createElement("link");css.rel="stylesheet";css.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(css);
      const js=document.createElement("script");js.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";js.onload=()=>setLeafletReady(true);document.head.appendChild(js);
    },[]);

    // Init map
    useEffect(()=>{
      if(!leafletReady||!mapRef.current||initDone.current) return;
      initDone.current=true;
      const L=window.L;
      mapInstance.current=L.map(mapRef.current,{zoomControl:true}).setView([27.9,-81.7],8);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:'© CartoDB',maxZoom:19}).addTo(mapInstance.current);
      markersLayer.current=L.layerGroup().addTo(mapInstance.current);
      return()=>{if(mapInstance.current){mapInstance.current.remove();mapInstance.current=null;initDone.current=false;}};
    },[leafletReady]);

    // Update markers
    useEffect(()=>{
      if(!leafletReady||!markersLayer.current) return;
      const L=window.L;
      markersLayer.current.clearLayers();
      // Seller pins
      const visibleSellers=sellers.filter(s=>{
        if(!s.lat||!s.lon) return false;
        if(!showArchived&&s.archived) return false;
        if(!statusFilters[s.status]) return false;
        return true;
      });
      visibleSellers.forEach(s=>{
        const color=STATUS_COLORS[s.status]||C.textMuted;
        const marker=L.circleMarker([s.lat,s.lon],{radius:8,fillColor:color,color:color,fillOpacity:0.85,weight:2});
        marker.bindPopup(`<div style="font-family:sans-serif;min-width:180px"><b style="font-size:14px">${s.name||"Unknown"}</b><br/><span style="color:#999">${s.address||""}</span><br/><span style="color:${color};font-weight:600">${s.status}</span><br/>${s.phone?`<a href="tel:${s.phone}" style="color:#D4AF37">${s.phone}</a><br/>`:""}<button onclick="window.__monarchLogCall('${s.id}')" style="margin-top:8px;padding:4px 12px;background:#D4AF37;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px">Log Call</button></div>`);
        markersLayer.current.addLayer(marker);
      });
      // Buyer territories
      if(showBuyers){
        activeBuyers.forEach(b=>{
          if(!b.locations) return;
          const locs=b.locations.toLowerCase().split(",").map(x=>x.trim());
          locs.forEach(loc=>{
            const coords=COUNTY_COORDS[loc];
            if(!coords) return;
            const circle=L.circle(coords,{radius:24000,color:C.gold,fillColor:C.gold,fillOpacity:0.07,weight:1.5,dashArray:"6 4"});
            circle.bindPopup(`<div style="font-family:sans-serif"><b style="color:#D4AF37">${b.name}</b><br/>Max: $${Number(b.maxPrice||0).toLocaleString()}<br/>${b.minAcres||"?"}-${b.maxAcres||"?"} acres<br/><span style="color:#999">${b.locations}</span></div>`);
            markersLayer.current.addLayer(circle);
          });
        });
      }
    },[leafletReady,sellers,showBuyers,showArchived,statusFilters,activeBuyers]);

    // Global callback for popup button
    useEffect(()=>{window.__monarchLogCall=(id)=>{setPrefillCallId(id);setPage("calls");};return()=>{delete window.__monarchLogCall;};},[]);

    const toggleStatus=(s)=>setStatusFilters(p=>({...p,[s]:!p[s]}));
    const geocoded=sellers.filter(s=>s.lat&&s.lon).length;

    return(<div style={{position:"relative"}}>
      <TopBar title="Seller Map" subtitle={`${geocoded} of ${sellers.filter(s=>!s.archived).length} sellers geocoded`}/>
      <div style={{position:"relative",borderRadius:16,overflow:"hidden",border:`1px solid ${C.goldBorder}`}}>
        <div ref={mapRef} style={{height:"calc(100vh - 160px)",width:"100%",background:"#1a1a2e"}}/>
        {/* Filter panel */}
        <div style={{position:"absolute",top:16,right:16,zIndex:1000,background:C.bgCard,border:`1px solid ${C.goldBorder}`,borderRadius:14,padding:16,maxWidth:220,maxHeight:"60vh",overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
          <div style={{fontSize:12,color:C.gold,fontWeight:600,letterSpacing:1,marginBottom:10}}>FILTERS</div>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.text,marginBottom:8,cursor:"pointer"}}>
            <input type="checkbox" checked={showBuyers} onChange={()=>setShowBuyers(!showBuyers)}/> Show Buyers
          </label>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.text,marginBottom:10,cursor:"pointer"}}>
            <input type="checkbox" checked={showArchived} onChange={()=>setShowArchived(!showArchived)}/> Show Archived
          </label>
          <div style={{fontSize:11,color:C.textMuted,letterSpacing:1,marginBottom:6}}>STATUS</div>
          {CALL_STATUSES.map(s=>(
            <label key={s} style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:statusFilters[s]?STATUS_COLORS[s]||C.text:C.textMuted,marginBottom:4,cursor:"pointer"}}>
              <input type="checkbox" checked={!!statusFilters[s]} onChange={()=>toggleStatus(s)}/> {s}
            </label>
          ))}
        </div>
      </div>
      <HelpButton pageId="map"/>
    </div>);
  };

  if(page==="welcome"||!profile) return <WelcomePage/>;

  const pages = {dashboard:<DashboardPage/>,buyers:<BuyersPage/>,sellers:<SellersPage/>,calls:<CallsPage/>,analyzer:<AnalyzerPage/>,pipeline:<PipelinePage/>,templates:<TemplatesPage/>,metrics:<MetricsPage/>,matching:<MatchingPage/>,financial:<FinancialPage/>,calendar:<CalendarPage/>,map:<MapPage/>,velocity:<VelocityPage/>,market:<MarketPage/>,feedback:<FeedbackPage/>,bulk:<BulkPage/>,data:<DataPage/>};

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,color:C.text,fontFamily:FB}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.12);border-radius:3px;}
        input:focus,select:focus,textarea:focus{border-color:${C.gold}!important;box-shadow:0 0 0 3px rgba(212,175,55,0.08)!important;}
        button:hover{opacity:0.88;}
        tr:hover td{background:rgba(212,175,55,0.03);}
        @media(max-width:900px){.m-sidebar{display:none!important;}.m-burger{display:flex!important;}.m-main{padding:16px!important;}.qa-grid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:700px){.dash-two-col{grid-template-columns:1fr!important;}.stats-row{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>
      <button className="m-burger" onClick={()=>setMobileNav(!mobileNav)} style={{display:"none",position:"fixed",top:14,left:14,zIndex:1001,background:C.bgCard,border:`1px solid ${C.goldBorder}`,borderRadius:12,padding:"10px 14px",cursor:"pointer",color:C.gold,fontSize:18,alignItems:"center",justifyContent:"center"}}>☰</button>
      {mobileNav&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:999}} onClick={()=>setMobileNav(false)}/>}
      {mobileNav&&<Sidebar mobile/>}
      <div className="m-sidebar"><Sidebar/></div>
      <main className="m-main" style={{flex:1,padding:"28px 36px",overflowY:"auto",minWidth:0,background:C.bg}}>
        {pages[page]||<DashboardPage/>}
      </main>
      {toasts.length>0&&<div style={{position:"fixed",bottom:24,left:24,zIndex:3000,display:"flex",flexDirection:"column",gap:8}}>{toasts.map(t=><div key={t.id} style={{background:C.bgCard,border:`1px solid ${C.goldBorder}`,borderRadius:12,padding:"12px 20px",fontSize:13,color:t.type==="error"?C.red:C.gold,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",animation:"fadeIn 0.3s"}}>{t.message}</div>)}</div>}
    </div>
  );
}
