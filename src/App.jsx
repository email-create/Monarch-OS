import { useState, useEffect, useRef } from "react";
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
  followUpEmail:{title:"Follow-Up Email",content:`Subject: Following Up — Your Property at [Address]\n\nHi [Name],\n\nI wanted to follow up on my previous message about your property at [Address]. Our buyers are still actively looking in [County], and I'd love to connect with you if you're open to discussing an offer.\n\nAs a reminder, we offer:\n• Cash purchase — no financing delays\n• We cover closing costs\n• Close in as little as 14 days\n• Simple, hassle-free process\n\nIf you're interested, simply reply here or call me at [Phone]. No pressure either way!\n\nBest,\n[Your Name]\nJW Monarch`},
  salesScript:{title:"Sales Script",content:`Hi (Seller Name), this is (Your Name)!\n\n(Pause and let the seller respond, sound like the neighbor next door, not a salesperson, come off like you already know each other).\n\nI'm calling you about your property (PROPERTY ADDRESS) you just recently spoke with one of my assistants about it and recommended it as a good fit. Did I catch you at a bad time?\n\n(Pull Away, allow them to answer)\n\nThey mentioned here in the notes you are wanting to sell your property. Some of the benefits in working with us is we buy the lot cash, cover ALL CLOSING COSTS and there are NO COMMISSIONS; the offer will be net to you and the amount you will receive in full on the closing date. We have closed on over 500 properties over the past 18 months and yours fits what we are looking for.\n\nCatch me up to speed… why are you considering selling?\n\nDIG DEEPER ON WHY THEY WANT TO SELL:\n- How long have you been thinking of selling?\n- What will selling do for you/help you accomplish?\n- What will the money be used for…?\n- How long have you owned the property?\n\nIs the title clear and is it just you that owns the property?\n\nIn a perfect world, what were you hoping to walk away with? Ballpark?\n\nIf we can agree on everything for your property today, do you mind if I tell you how the process will work?\n\nTHEY ACCEPT YOUR OFFER:\n- Collect Email address for Contract\n- See when they will be able to review the contract\n- Walk them through the agreement line by line\n- Sign\n- Always feel free to call me or anyone on our team`},
  sellerContract:{title:"Seller Contract",content:`LAND SALE AGREEMENT\n\nThis Contract dated _______ in which Buyer: _______ and/or assigns, offers to purchase from Seller(s): _______ the following described real estate, together with all improvements thereon and all appurtenant rights, located at: _______\n\nSeller agrees:\n1) The purchase price is to be $_______ paid in full to the seller at closing.\n2) Conditions:\n   a) Property sold "AS IS" with no warranties.\n   b) If buyer unable to complete purchase, earnest money forfeited as liquidated damages.\n   c) If Seller cannot provide clear title, Buyer released from obligation.\n   d) Buyer will perform a feasibility study at Buyer's expense.\n   e) Closing Agent Located at: _______\n3) Earnest Money: $_______ deposited at closing attorney's office.\n4) Taxes prorated. All closing fees PAID BY BUYER.\n5) Closing date: on or before ___ days from date signed. Title to be free, clear, and unencumbered.`},
  landAssignment:{title:"Land Assignment Contract",content:`ASSIGNMENT OF REAL ESTATE PURCHASE AND SALE AGREEMENT\n\nDate: _______\nAssignor: _______\nAssignee (Buyer): _______\nOriginal Seller: _______\nProperty Address: _______\n\n1. RECITALS\nA. The Assignor has entered into a legally binding Purchase and Sale Agreement with the Original Seller.\nB. The Assignor desires to assign all rights to the Assignee.\nC. The Assignee accepts and assumes all obligations.\n\n2. PURCHASE PRICE: $_______ paid at closing.\n3. EARNEST MONEY: $_______ deposited within ___ business days.\n4. CLOSING: On or before _______. Title conveyed free and clear. Buyer covers all closing costs.\n5. AS-IS CONDITION: No warranties. Due Diligence: ___ days from execution.\n6. DEFAULT: Earnest money forfeited as liquidated damages.\n7. GOVERNING LAW: State where property is located.`},
  contractAddendum:{title:"Contract Addendum",content:`ADDENDUM TO CONTRACT\nFLORIDA ASSOCIATION OF REALTORS®\n\nAddendum No. ___ to the Contract dated _______ between\n_______ (Seller) and _______ (Buyer)\nconcerning the property described as: _______\n\nBuyer and Seller make the following terms and conditions part of the Contract:\n\nBuyer hereby assigns Contract to: _______\n\nDue Diligence Period: Assignee will have 30 days from the acceptance date to determine if the land is suitable. Assignee may terminate before the end of the due diligence period and escrow agent shall immediately refund earnest money.\n\nClosing Date: _______\nInitial Deposit: $_______ /Property`},
  buyerOutreach:{title:"Buyer Outreach Script",content:`Website to find LLC:\nSearch for Corporations, LLCs, LPs at sunbiz.org — search by name. Write down the owner/manager and their address.\n\nGo to TruePeopleSearch.com for phone numbers.\n\nWhen they answer a call:\n"Good morning/afternoon this is [Your Name] calling with JW Monarch; is this the correct number for [Company or Owner Name]?"\n\nIf Yes:\n"I was calling because I see you have recently been purchasing lots in [City] and we do a lot of work out there. We are currently doing 20-30 deals per month. If you are looking to purchase more properties, you can save us the cost of closing and the time, and we can save you money and get you these lots below market. What are you currently looking for?"\n\n**Take notes on everything they come back with**\n\nIF THEY GIVE TROUBLE:\n"We have done upwards of 500 assignments in the past two years, we ID and passport verify all our sellers to avoid fraud; we also never get anything on the market. We will match the contracts up to your terms."\n\nQUESTIONS TO ASK:\n• What title company do you use?\n• What is your time frame on due diligence and closing?\n• What is your standard earnest money deposit?\n• Is there anything you avoid? Flood zones, wetlands, etc?\n\nTake down email and phone, let them know you'll reach out with deals.`},
  wireTemplate:{title:"Wire Information Template",content:`Wire Information Template\n\nBank: [Bank Name]\nBusiness: [Business Name or LLC Name]\nEIN: [EIN or Tax ID]\nName: [Recipient Full Name]\nAddress: [Recipient Address]\nAccount Number: [Account Number]\nRouting Number: [Routing Number]\n\nThis is a template. Do not share your actual wire transfer information publicly.`},
  terminationEmail:{title:"Termination Email",content:`Subject Line: Termination (Property Address) (Date)\n\nUnfortunately, we will not be able to move forward with the Purchase of Sales Agreement for PROPERTY ADDRESS owned by OWNERS ON TITLE.\n\nLocated Under Section 2 in the Florida Vacant Land Sale Agreement: "Buyer will, at Buyer's expense, perform a feasibility study to determine whether the property is suitable for desired use. The feasibility study period shall be 10 business days from the effective date."\n\nWe are moving forward with other ventures. Hopefully we can do business in the future.`},
  contractStatement:{title:"Contract Statement",content:`Subject line: (Property Address) Proposal\n\nHi this is (YOUR NAME) from (YOUR COMPANY), attached is the contract for your property. Once all parties sign electronically and hit finish, we will momentarily receive the completed contract and will move onto the next part of the closing process. If any questions at all don't hesitate to reach out!\n\nOur Company Commitment to you is to provide a stress-free process by offering you a professional service to include 100% availability and clear communication.\n\nThis is a very large and important transaction; we want to ensure that we fulfill all of your needs.\n\nThank you for giving us the opportunity to purchase your property.\n\nCall, text or email my personal phone with any questions I can help clear up for you.\n\nYOUR NAME\nEmail:\nPhone:\nWEBSITE`}
};

const HELP_CONTENT = {
  dashboard:{title:"Dashboard",desc:"Your command center overview showing key metrics, quick actions, and recent activity at a glance.",features:["View active deals, pipeline profit, and buyer count","Quick action buttons to jump to common tasks","Recent call activity and deal pipeline donut chart","Compare view to see both profiles side-by-side"]},
  sellers:{title:"Seller Management",desc:"Track and manage all your property seller contacts. Each profile maintains their own separate seller list.",features:["Add, edit, and archive sellers","Import sellers from PropStream data","Track seller status through the sales cycle","Inline status editing and days since contact","Search, filter, and quick-filter chips","Matched buyers shown per seller row","Tel: links for one-tap calling"]},
  calls:{title:"Call Tracker",desc:"Log and track all your outreach calls. Call data is personal to each profile.",features:["Log calls with date, time, and outcome","Track what was discussed and objections raised","Auto-update seller status based on call results","Schedule follow-up calls","View call stats (total, this week, interested)"]},
  calculator:{title:"Deal Calculator",desc:"Calculate offer prices and analyze deal profitability before making offers.",features:["Input property details (acres, FMV, buyer price)","Get recommended offer price based on FMV %","See projected profit and buyer savings","Save analyzed deals directly to your pipeline","Matching buyers preview based on criteria"]},
  pipeline:{title:"Deal Pipeline",desc:"Manage your active deals from prospect to close. Each profile has their own pipeline.",features:["Track deals through 5 stages: Prospect → Closed","Link deals to specific buyers","Set target close dates","Filter by status or buyer","Sortable columns"]},
  templates:{title:"Outreach Templates",desc:"Pre-built scripts and email templates for cold calling, follow-ups, and handling objections. Shared across both profiles.",features:["Sales script, cold call, and email templates","Contract templates (seller, assignment, addendum)","Buyer outreach and wire templates","Objection handling responses","Editable — customize and save your own versions","One-click copy to clipboard"]},
  analytics:{title:"Analytics",desc:"Track performance metrics, financial data, and pipeline velocity in one view.",features:["Total calls and conversion rate","Revenue and profit tracking","Average profit per deal","Pipeline stage breakdown and conversion rates","Active deal age tracking","Profit by buyer breakdown"]},
  calendar:{title:"Calendar / Tasks",desc:"Manage follow-ups and tasks. Each profile has their own calendar.",features:["View follow-ups due today","See upcoming tasks this week","Overdue follow-ups highlighted","Mark sellers as called directly"]},
  map:{title:"Seller Map",desc:"Visualize your sellers and buyer territories on an interactive map.",features:["See all geocoded sellers as colored pins (color = status)","Buyer territories shown as gold circles","Click pins for seller details and quick call","Filter by status, toggle buyers, show archived","Dark and satellite tile toggle","Auto-geocoding runs in background"]},
  notes:{title:"Personal Notes",desc:"Record lessons learned and script effectiveness after deals. Personal to each profile.",features:["Link notes to specific deals","Track won/lost/stalled outcomes","Record lessons learned","Rate script effectiveness","Post-mortem analysis"]},
  dataImport:{title:"Data & Import",desc:"Import sellers in bulk, export data, and manage storage.",features:["Bulk import from CSV/tab data","Mass follow-up scheduling","Export any data type to CSV","View record counts per section","Clear all data with confirmation"]},
  buyers:{title:"Buyer Management",desc:"Manage your buyer network. Buyers are shared across both profiles.",features:["Add and edit buyer profiles","Set lot size and price criteria","Specify preferred locations","Toggle buyers active/inactive","Link buyers to deals and sellers"]}
};

const COUNTY_COORDS = {
  "broward":[26.19,-80.36],"miami-dade":[25.77,-80.29],"miami dade":[25.77,-80.29],"palm beach":[26.71,-80.06],
  "orange":[28.38,-81.38],"hillsborough":[27.90,-82.35],"pinellas":[27.88,-82.72],"duval":[30.33,-81.66],
  "lee":[26.57,-81.87],"collier":[26.11,-81.40],"osceola":[28.06,-81.07],"brevard":[28.26,-80.74],
  "polk":[27.95,-81.70],"volusia":[29.03,-81.09],"seminole":[28.71,-81.24],"sarasota":[27.18,-82.37],
  "manatee":[27.48,-82.39],"pasco":[28.30,-82.43],"lake":[28.77,-81.72],"st. lucie":[27.38,-80.39],
  "st lucie":[27.38,-80.39],"martin":[27.08,-80.41],"indian river":[27.69,-80.57],"charlotte":[26.89,-82.01],
  "hernando":[28.55,-82.47],"citrus":[28.85,-82.52],"marion":[29.21,-82.06],"alachua":[29.67,-82.37],
  "horry":[33.68,-78.99],"georgetown":[33.37,-79.29],"brunswick":[34.05,-78.26],
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
  analytics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  notes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
};

const NAV_ITEMS = [
  {id:"dashboard",label:"Dashboard",icon:Icons.dashboard},
  {id:"buyers",label:"Buyers",icon:Icons.buyers},
  {id:"sellers",label:"Sellers",icon:Icons.sellers},
  {id:"calls",label:"Call Tracker",icon:Icons.calls},
  {id:"calculator",label:"Calculator",icon:Icons.analyzer},
  {id:"pipeline",label:"Pipeline",icon:Icons.pipeline},
  {id:"templates",label:"Templates",icon:Icons.templates},
  {id:"analytics",label:"Analytics",icon:Icons.analytics},
  {id:"calendar",label:"Calendar",icon:Icons.calendar},
  {id:"map",label:"Map",icon:Icons.mapPin},
  {id:"notes",label:"Personal Notes",icon:Icons.notes},
  {id:"dataImport",label:"Data & Import",icon:Icons.data},
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

// ─── Template fill helper ───
const fillTemplate = (content, data={}) => {
  const county = data.address ? (data.address.split(",").slice(-2,-1)[0]||"").trim() : "";
  return content.replace(/\[Name\]/g, data.name||"[Name]").replace(/\[Address\]/g, data.address||"[Address]").replace(/\[Property Address\]/g, data.address||"[Property Address]").replace(/\[Phone\]/g, data.phone||"[Phone]").replace(/\[Email\]/g, data.email||"[Email]").replace(/\[Your Name\]/g, data.yourName||"(Your Name)").replace(/\[YOUR NAME\]/g, data.yourName||"(Your Name)").replace(/\(YOUR NAME\)/g, data.yourName||"(Your Name)").replace(/\[YOUR COMPANY\]/g, "JW Monarch").replace(/\(YOUR COMPANY\)/g, "JW Monarch").replace(/\[County\]/g, county||"[County]").replace(/\[County\/City\]/g, county||"[County/City]");
};

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

// ═══ WELCOME SCREEN — Gold Dust (defined outside MonarchOS to prevent remounting) ═══
const WelcomePage = ({onSelectProfile}) => {
  const particles = Array.from({length:135},(_,i)=>({
    id:i, left:Math.random()*100, delay:3+Math.random()*8, duration:7.9+Math.random()*10.6, size:1.2+Math.random()*2.3, opacity:0.24+Math.random()*0.56
  }));
  return (
  <div style={{position:"fixed",inset:0,background:C.bg,zIndex:9999,overflow:"hidden",fontFamily:FH}}>
    <style>{`
      @keyframes dustFall{0%{transform:translateY(-20px) translateX(0);opacity:0}10%{opacity:var(--dust-op)}50%{opacity:var(--dust-op)}100%{transform:translateY(calc(100vh + 20px)) translateX(30px);opacity:0}}
      @keyframes dustShimmer{0%,100%{opacity:var(--dust-op)}50%{opacity:calc(var(--dust-op) * 0.4)}}
      @keyframes dustFadeIn{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
      @keyframes dustRing{0%{width:0;height:0;opacity:0.5}100%{width:800px;height:800px;opacity:0}}
      .dust-particle{position:absolute;border-radius:50%;background:${C.gold};box-shadow:0 0 6px 1px rgba(212,175,55,0.4);animation:dustFall var(--dust-dur) linear var(--dust-delay) infinite, dustShimmer 2s ease-in-out var(--dust-delay) infinite;pointer-events:none;z-index:1}
      .dust-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:1px solid ${C.gold};opacity:0;animation:dustRing 2s cubic-bezier(0.16,1,0.3,1) 0.5s forwards;pointer-events:none;z-index:2}
      .dust-content{animation:dustFadeIn 1s cubic-bezier(0.16,1,0.3,1) 0.8s both}
      .dust-buttons{animation:dustFadeIn 0.9s cubic-bezier(0.16,1,0.3,1) 1.3s both}
      .dust-footer{animation:dustFadeIn 0.8s ease 1.8s both}
      .dust-btn{position:relative;padding:18px 48px;border-radius:14px;border:1px solid ${C.goldBorder};background:${C.bg};color:${C.goldLight};font-size:20px;font-family:${FH};font-weight:400;letter-spacing:2px;cursor:pointer;transition:all 0.4s;overflow:hidden}
      .dust-btn::after{content:'';position:absolute;bottom:6px;left:50%;transform:translateX(-50%);width:0;height:1px;background:${C.gold};transition:width 0.4s cubic-bezier(0.16,1,0.3,1)}
      .dust-btn:hover::after{width:60%}
      .dust-btn:hover{background:rgba(212,175,55,0.06);border-color:${C.gold}60}
    `}</style>
    {particles.map(p=><div key={p.id} className="dust-particle" style={{"--dust-dur":p.duration+"s","--dust-delay":p.delay+"s","--dust-op":p.opacity,left:p.left+"%",width:p.size,height:p.size,top:-20}}/>)}
    <div className="dust-ring"/>
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}>
      <div style={{textAlign:"center",maxWidth:700,padding:40}}>
        <div className="dust-content">
          <div style={{fontSize:46,fontWeight:300,color:C.goldLight,letterSpacing:3,lineHeight:1,whiteSpace:"nowrap"}}>Welcome to Monarch OS</div>
          <div style={{fontSize:14,color:C.gold,letterSpacing:4,marginTop:12,fontFamily:FB}}>by JW Monarch</div>
          <div style={{width:80,height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"20px auto",opacity:0.6}}/>
          <p style={{fontSize:15,color:C.textSec,letterSpacing:2,fontWeight:300,fontFamily:FB}}>Land Wholesaling Command Center</p>
        </div>
        <div className="dust-buttons" style={{marginTop:56}}>
          <p style={{fontSize:13,color:C.textMuted,marginBottom:20,letterSpacing:1,fontFamily:FB}}>Select your profile</p>
          <div style={{display:"flex",gap:16,justifyContent:"center"}}>
            {PROFILES.map(p=><button key={p} className="dust-btn" onClick={()=>onSelectProfile(p)}>{p}</button>)}
          </div>
        </div>
        <p className="dust-footer" style={{marginTop:60,fontSize:10,color:C.textMuted,letterSpacing:3,opacity:0.4,fontFamily:FB}}>© {new Date().getFullYear()} JW MONARCH</p>
      </div>
    </div>
  </div>);
};

// ═══ MAIN APP ═══
export default function MonarchOS() {
  const [page, setPage] = useState("welcome");
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(() => { try { return localStorage.getItem("monarchOS_activeProfile")||""; } catch{return "";} });
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [prefillCallId, setPrefillCallId] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const addToast = (message, type="success") => { const id=crypto.randomUUID(); setToasts(p=>[...p,{id,message,type}]); setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500); };

  // SHARED data (same for both profiles)
  const [buyers, setBuyers] = useState([]);

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

  // ═══ SIDEBAR ═══
  const sW = sidebarCollapsed ? 68 : 240;
  const Sidebar = ({mobile}) => (
    <div style={{width:mobile?260:sW,minWidth:mobile?260:sW,background:C.bgSidebar,borderRight:`1px solid ${C.goldBorder}`,display:"flex",flexDirection:"column",height:mobile?"100dvh":"100vh",overflow:"hidden",position:mobile?"fixed":"sticky",top:0,zIndex:mobile?4000:10,...(mobile?{left:0}:{}),transition:"width 0.3s, min-width 0.3s"}}>
      <div style={{padding:sidebarCollapsed?"18px 12px":"22px 20px",borderBottom:`1px solid ${C.goldBorder}`,display:"flex",alignItems:"center",gap:12,justifyContent:sidebarCollapsed?"center":"flex-start"}}>
        <div style={{fontSize:22,color:C.gold,lineHeight:1,flexShrink:0}}>♛</div>
        {!sidebarCollapsed && <div><div style={{fontSize:13,letterSpacing:2,color:C.gold,fontWeight:600,lineHeight:1}}>Monarch OS</div><div style={{fontSize:10,color:C.textMuted,letterSpacing:1,marginTop:3}}>JW Monarch</div></div>}
      </div>
      {profile && !sidebarCollapsed && (
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.goldBorder}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:12,background:`linear-gradient(135deg,${C.gold}30,${C.gold}10)`,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontSize:14,fontWeight:600,flexShrink:0}}>{profile.charAt(0).toUpperCase()}</div>
          <div style={{minWidth:0}}><div style={{fontSize:13,color:C.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile}</div><div style={{fontSize:10,color:C.textMuted,letterSpacing:1}}>OPERATOR</div></div>
        </div>
      )}
      <nav style={{flex:1,padding:"68px 0 80px",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
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
    <div className="m-topbar" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,position:"relative",zIndex:1500}}>
      <div><h1 style={{fontSize:26,fontWeight:400,color:C.text,margin:0,letterSpacing:1,fontFamily:FH}}>{title}</h1>{subtitle && <p style={{fontSize:13,color:C.textMuted,marginTop:4,letterSpacing:0.5}}>{subtitle}</p>}</div>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        {todayFollowUps.length > 0 && <div onClick={()=>setPage("calendar")} style={{position:"relative",cursor:"pointer",color:C.textSec,padding:8,borderRadius:10,background:"rgba(255,255,255,0.03)"}}>{Icons.bell}<span style={{position:"absolute",top:4,right:4,width:16,height:16,borderRadius:8,background:C.red,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{todayFollowUps.length}</span></div>}
        <div ref={dropRef} style={{position:"relative"}}>
          <div onClick={()=>setShowDrop(!showDrop)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRadius:12,background:"rgba(255,255,255,0.03)",cursor:"pointer",border:`1px solid ${showDrop?C.gold+"40":"transparent"}`}}>
            <div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${C.gold}30,${C.gold}10)`,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontSize:13,fontWeight:600}}>{(profile||"U").charAt(0).toUpperCase()}</div>
            <div><div style={{fontSize:13,color:C.text,fontWeight:500}}>{profile||"Select"}</div><div style={{fontSize:10,color:C.textMuted,letterSpacing:0.5}}>Operator</div></div>
            <span style={{color:C.textMuted,fontSize:10,marginLeft:4}}>▼</span>
          </div>
          {showDrop && <div style={{position:"absolute",top:"100%",right:0,marginTop:6,background:"#1E1E1E",border:`1px solid ${C.goldBorder}`,borderRadius:12,overflow:"hidden",zIndex:2500,minWidth:160,boxShadow:"0 12px 32px rgba(0,0,0,0.5)"}}>
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
    const quickActions = [{label:"Add Seller",icon:Icons.sellers,color:C.blue,page:"sellers"},{label:"Log Call",icon:Icons.calls,color:C.green,page:"calls"},{label:"Calculator",icon:Icons.analyzer,color:C.purple,page:"calculator"},{label:"Pipeline",icon:Icons.pipeline,color:C.orange,page:"pipeline"}];

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
            {[{l:"Buyers",p:"buyers"},{l:"Templates",p:"templates"},{l:"Analytics",p:"analytics"},{l:"View All",p:"dataImport"}].map(b=>(
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
            {/* Pipeline Health — heart with fill level */}
            {(()=>{const contacted30=sellers.filter(s=>!s.archived&&s.lastContact).filter(s=>Math.floor((Date.now()-new Date(s.lastContact+"T00:00:00"))/864e5)<=30).length;const totalActive=sellers.filter(s=>!s.archived).length||1;const pctContacted=(contacted30/totalActive)*100;const dealsWithClose=deals.filter(d=>d.targetClose).length;const totalDeals=deals.length||1;const pctClose=(dealsWithClose/totalDeals)*100;const intSellers=sellers.filter(s=>["Interested","Negotiating","Under Contract"].includes(s.status));const linkedInt=intSellers.filter(s=>deals.some(d=>d.sellerId===s.id)).length;const pctLinked=intSellers.length?(linkedInt/intSellers.length)*100:100;const convCapped=Math.min(Number(convRate||0)/20*100,100);const score=Math.round(pctContacted*0.3+pctClose*0.2+pctLinked*0.25+convCapped*0.25);const color=score>=70?C.green:score>=40?C.orange:C.red;const fillY=90-((score/100)*70);
            return<Card style={{maxWidth:340}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}><div><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH}}>Pipeline Health</div><div style={{fontSize:12,color:C.textMuted,marginTop:2}}>Contacted {contacted30}/{totalActive} · {dealsWithClose}/{totalDeals} close dates</div></div></div>
              <div style={{position:"relative",width:140,height:130,margin:"12px auto 0"}}>
                <svg viewBox="0 0 100 90" style={{width:"100%",height:"100%"}}>
                  <defs><clipPath id="heartClip"><path d="M50 85 C50 85 5 55 5 30 C5 15 18 5 32 5 C40 5 46 10 50 18 C54 10 60 5 68 5 C82 5 95 15 95 30 C95 55 50 85 50 85Z"/></clipPath></defs>
                  <path d="M50 85 C50 85 5 55 5 30 C5 15 18 5 32 5 C40 5 46 10 50 18 C54 10 60 5 68 5 C82 5 95 15 95 30 C95 55 50 85 50 85Z" fill={color} opacity="0.08" stroke={color} strokeWidth="1.5" strokeOpacity="0.25"/>
                  <rect x="0" y={fillY} width="100" height={90-fillY} fill={color} opacity="0.25" clipPath="url(#heartClip)"/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingBottom:6}}>
                  <div style={{fontSize:34,fontWeight:400,color,lineHeight:1,fontFamily:FH}}>{score}</div>
                  <div style={{fontSize:9,color:C.textMuted,letterSpacing:1,textTransform:"uppercase",marginTop:3}}>Score</div>
                </div>
              </div>
            </Card>;})()}
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

        {/* Hot Leads */}
        {(()=>{const scored=sellers.filter(s=>!s.archived).map(s=>{const sw={Interested:5,Negotiating:4,Called:2,Voicemail:1}[s.status]||0;const days=s.lastContact?Math.floor((Date.now()-new Date(s.lastContact+"T00:00:00"))/864e5):999;const recency=days<=7?3:days<=30?1:0;const fuDays=s.followUp?Math.floor((new Date(s.followUp+"T00:00:00")-Date.now())/864e5):999;const urgency=fuDays<0?4:fuDays===0?3:0;return{...s,score:sw+recency+urgency};}).sort((a,b)=>b.score-a.score).slice(0,5).filter(s=>s.score>0);
        return scored.length>0&&<Card style={{marginTop:18}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>🔥 Hot Leads</div>{scored.map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.goldBorder}`}}><div><span style={{fontWeight:500,fontSize:13}}>{s.name||s.address||"Unknown"}</span><div style={{display:"flex",gap:6,marginTop:4}}><Badge color={STATUS_COLORS[s.status]}>{s.status}</Badge></div></div><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:80,height:6,borderRadius:3,background:"rgba(255,255,255,0.04)"}}><div style={{height:6,borderRadius:3,background:C.gold,width:`${Math.min(s.score/12*100,100)}%`}}/></div><button style={{...btnSmall,padding:"5px 12px",fontSize:11}} onClick={()=>{setPrefillCallId(s.id);setPage("calls");}}>Call</button></div></div>)}</Card>;})()}

        <HelpButton pageId="dashboard"/>
      </div>
    );
  };

  // ═══ BUYERS (SHARED) ═══
  const BuyersPage = () => {
    const [modal,setModal]=useState(null);const blank={name:"",phone:"",email:"",minAcres:"",maxAcres:"",maxPrice:"",locations:"",notes:"",active:true};const [form,setForm]=useState(blank);
    const saveBuyer=()=>{if(!form.name)return;const now=new Date().toISOString();if(modal==="new")setBuyers(p=>[{...form,id:uid(),updatedAt:now},...p]);else setBuyers(p=>p.map(b=>b.id===modal?{...b,...form,updatedAt:now}:b));setModal(null);addToast("Buyer saved");};
    const del=id=>setBuyers(p=>p.filter(b=>b.id!==id));
    const getBuyerCalls=(bid)=>calls.filter(c=>c.buyerId===bid);
    return(<div><TopBar title="Buyer Management"/><div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button style={btnStyle} onClick={()=>{setForm(blank);setModal("new");}}>+ Add Buyer</button></div>
      {buyers.length===0?<EmptyState icon="♛" msg="No buyers yet. Add your first buyer." action="Add Buyer" onAction={()=>{setForm(blank);setModal("new");}}/>:<Card style={{padding:0,overflow:"hidden"}}><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:"16px 0 0 0"}}>Name</th><th style={thStyle}>Max Price</th><th style={thStyle}>Locations</th><th style={thStyle}>Status</th><th style={{...thStyle,borderRadius:"0 16px 0 0"}}>Actions</th></tr></thead><tbody>{buyers.map(b=>{const bc=getBuyerCalls(b.id).length;return<tr key={b.id}><td style={tdStyle}><div><span style={{fontWeight:500}}>{b.name}</span><div style={{fontSize:11,color:C.textMuted}}>{b.phone}</div>{bc>0&&<Badge color={C.blue}>{bc} call{bc>1?"s":""}</Badge>}</div></td><td style={tdStyle}>{fmt$(b.maxPrice)}</td><td style={tdStyle}>{b.locations||"—"}</td><td style={tdStyle}><Badge color={b.active!==false?C.green:C.red}>{b.active!==false?"Active":"Inactive"}</Badge></td><td style={tdStyle}><div style={{display:"flex",gap:6}}><button style={btnSmall} onClick={()=>{setForm(b);setModal(b.id);}}>Edit</button><button style={btnDanger} onClick={()=>del(b.id)}>Del</button></div></td></tr>})}</tbody></table></Card>}
      {modal&&<Modal title={modal==="new"?"Add Buyer":"Edit Buyer"} onClose={()=>setModal(null)}><div style={formRow}><FormField label="Name"><input style={inputStyle} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></FormField><FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Email"><input style={inputStyle} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></FormField><FormField label="Max Price"><input style={inputStyle} type="number" value={form.maxPrice} onChange={e=>setForm(p=>({...p,maxPrice:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Min Acres"><input style={inputStyle} type="number" value={form.minAcres} onChange={e=>setForm(p=>({...p,minAcres:e.target.value}))}/></FormField><FormField label="Max Acres"><input style={inputStyle} type="number" value={form.maxAcres} onChange={e=>setForm(p=>({...p,maxAcres:e.target.value}))}/></FormField></div><FormField label="Preferred Locations" full><input style={inputStyle} value={form.locations} onChange={e=>setForm(p=>({...p,locations:e.target.value}))} placeholder="Horry, Georgetown"/></FormField><FormField label="Notes" full><textarea style={textareaStyle} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormField><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><label style={{fontSize:12,color:C.textSec}}>Active</label><input type="checkbox" checked={form.active!==false} onChange={e=>setForm(p=>({...p,active:e.target.checked}))}/></div>
        {modal!=="new"&&getBuyerCalls(modal).length>0&&<div style={{marginBottom:14}}><div style={{fontSize:13,color:C.goldLight,fontWeight:500,fontFamily:FH,marginBottom:8}}>Call History</div>{getBuyerCalls(modal).slice(0,10).map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}><span style={{color:C.textSec}}>{fmtDate(c.date)}</span><Badge color={STATUS_COLORS[c.result]}>{c.result}</Badge><span style={{color:C.textMuted,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.discussed||c.notes||"—"}</span></div>)}</div>}
        <button style={btnStyle} onClick={saveBuyer}>Save Buyer</button></Modal>}
      <HelpButton pageId="buyers"/>
    </div>);
  };

  // ═══ SELLERS (PERSONAL) ═══
  const SellersPage = () => {
    const [modal,setModal]=useState(null);const [importModal,setImportModal]=useState(false);const [importText,setImportText]=useState("");
    const [contractModal,setContractModal]=useState(null);const [contractTemplate,setContractTemplate]=useState("contractStatement");
    const blank={name:"",phone:"",email:"",address:"",status:"Not Called",lastContact:"",followUp:"",notes:"",buyerId:"",archived:false};
    const [form,setForm]=useState(blank);const [search,setSearch]=useState("");const [statusFilter,setStatusFilter]=useState("All");const [dupWarning,setDupWarning]=useState("");
    const checkDup=(f)=>{if(modal!=="new")return"";const match=sellers.find(s=>!s.archived&&((f.phone&&s.phone&&s.phone.trim().replace(/\D/g,"")===f.phone.trim().replace(/\D/g,""))||(f.address&&s.address&&s.address.trim().toLowerCase()===f.address.trim().toLowerCase())));return match?`A seller with this info already exists: ${match.name||match.address||match.phone}`:""};
    const saveSeller=(force)=>{if(modal==="new"&&!force){const w=checkDup(form);if(w){setDupWarning(w);return;}}const now=new Date().toISOString();if(modal==="new"){setSellers(p=>[{...form,id:uid(),updatedAt:now},...p]);addToast("Seller added");}else{setSellers(p=>p.map(l=>l.id===modal?{...l,...form,updatedAt:now}:l));addToast("Seller updated");}setModal(null);setDupWarning("");};
    const doImport=()=>{const lines=importText.trim().split("\n").filter(Boolean);const nl=lines.map(line=>{const p=line.split(/[,\t]+/).map(s=>s.trim());return{id:uid(),name:p[0]||"",address:p[1]||"",phone:p[2]||"",email:p[3]||"",status:"Not Called",lastContact:"",followUp:"",notes:"",buyerId:"",archived:false,updatedAt:new Date().toISOString()};});setSellers(p=>[...nl,...p]);setImportText("");setImportModal(false);addToast(`Imported ${nl.length} sellers`);};
    const inlineStatus=(id,newStatus)=>{setSellers(p=>p.map(l=>l.id===id?{...l,status:newStatus,lastContact:todayStr(),updatedAt:new Date().toISOString()}:l));};
    const logCallFor=(id)=>{setPrefillCallId(id);setPage("calls");};
    const linkDealToSeller=(dealId,sellerId)=>{setDeals(p=>p.map(d=>d.id===dealId?{...d,sellerId}:d));addToast("Deal linked");};
    const active=sellers.filter(l=>!l.archived);
    const filtered=active.filter(l=>{const q=search.toLowerCase();const matchSearch=!q||(l.name||"").toLowerCase().includes(q)||(l.address||"").toLowerCase().includes(q)||(l.phone||"").includes(q);const matchStatus=statusFilter==="All"||l.status===statusFilter;return matchSearch&&matchStatus;});
    const daysSince=(d)=>{if(!d)return null;return Math.floor((Date.now()-new Date(d+"T00:00:00"))/864e5);};
    const getSellerDeals=(sid)=>deals.filter(d=>d.sellerId===sid);
    return(<div><TopBar title="Seller Management"/><div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:18,flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:8,flex:1,minWidth:200}}>
        <input style={{...inputStyle,maxWidth:280}} placeholder="Search name, address, phone..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{...selectStyle,maxWidth:160}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="All">All Statuses</option>{CALL_STATUSES.map(s=><option key={s}>{s}</option>)}</select>
      </div>
      <div style={{display:"flex",gap:8}}><button style={btnOutline} onClick={()=>setImportModal(true)}>Import</button><button style={btnStyle} onClick={()=>{setForm(blank);setDupWarning("");setModal("new");}}>+ Add Seller</button></div>
    </div>
      <div style={{fontSize:12,color:C.textMuted,marginBottom:12}}>{filtered.length} of {active.length} sellers</div>
      {active.length===0?<EmptyState icon="◇" msg="No sellers yet. Add or import sellers." action="Add Seller" onAction={()=>{setForm(blank);setModal("new");}}/>:<Card style={{padding:0,overflow:"hidden"}}><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:"16px 0 0 0"}}>Name</th><th style={thStyle}>Address</th><th style={thStyle}>Status</th><th style={thStyle}>Last Contact</th><th style={thStyle}>Follow-Up</th><th style={{...thStyle,borderRadius:"0 16px 0 0"}}>Actions</th></tr></thead><tbody>{filtered.map(l=>{const days=daysSince(l.lastContact);const dc=getSellerDeals(l.id).length;return(<tr key={l.id}><td style={tdStyle}><div><span style={{fontWeight:500}}>{l.name||"Unknown"}</span>{l.phone&&<div><a href={`tel:${l.phone}`} style={{fontSize:11,color:C.gold,textDecoration:"none"}}>{l.phone}</a></div>}{dc>0&&<Badge color={C.gold}>{dc} deal{dc>1?"s":""}</Badge>}</div></td><td style={tdStyle}>{l.address||"—"}</td><td style={tdStyle}><select value={l.status} onChange={e=>inlineStatus(l.id,e.target.value)} style={{background:"transparent",border:"none",color:STATUS_COLORS[l.status]||C.text,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer",outline:"none"}}>{CALL_STATUSES.map(s=><option key={s} style={{background:C.bgCard,color:C.text}}>{s}</option>)}</select></td><td style={tdStyle}><span style={{fontSize:12,color:days===null?C.textMuted:days>30?C.red:days>14?C.orange:C.textSec}}>{days===null?"Never":`${days}d ago`}</span></td><td style={tdStyle}>{fmtDate(l.followUp)}</td><td style={tdStyle}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}><button style={{...btnSmall,padding:"5px 8px",fontSize:11}} onClick={()=>logCallFor(l.id)}>Call</button><button style={{...btnSmall,padding:"5px 8px",fontSize:11}} onClick={()=>setContractModal(l)}>✉</button><button style={{...btnSmall,padding:"5px 8px",fontSize:11}} onClick={()=>{setForm(l);setDupWarning("");setModal(l.id);}}>Edit</button><button style={{...btnDanger,padding:"5px 8px",fontSize:11}} onClick={()=>{setSellers(p=>p.map(x=>x.id===l.id?{...x,archived:true}:x));addToast("Seller archived");}}>Arc</button></div></td></tr>);})}</tbody></table></Card>}
      {modal&&<Modal title={modal==="new"?"Add Seller":"Edit Seller"} onClose={()=>{setModal(null);setDupWarning("");}}>
        {dupWarning&&<div style={{padding:"10px 14px",background:"rgba(255,149,0,0.1)",border:`1px solid ${C.orange}40`,borderRadius:10,marginBottom:14,fontSize:13,color:C.orange}}>{dupWarning}</div>}
        <div style={formRow}><FormField label="Name"><input style={inputStyle} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></FormField><FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></FormField></div><FormField label="Address" full><input style={inputStyle} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></FormField><div style={formRow}><FormField label="Email"><input style={inputStyle} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></FormField><FormField label="Status"><select style={selectStyle} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{CALL_STATUSES.map(s=><option key={s}>{s}</option>)}</select></FormField></div><div style={formRow}><FormField label="Last Contact"><input style={inputStyle} type="date" value={form.lastContact} onChange={e=>setForm(p=>({...p,lastContact:e.target.value}))}/></FormField><FormField label="Follow-Up"><input style={inputStyle} type="date" value={form.followUp} onChange={e=>setForm(p=>({...p,followUp:e.target.value}))}/></FormField></div><FormField label="Link to Buyer" full><select style={selectStyle} value={form.buyerId} onChange={e=>setForm(p=>({...p,buyerId:e.target.value}))}><option value="">— None —</option>{activeBuyers.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></FormField><FormField label="Notes" full><textarea style={textareaStyle} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormField>
        {modal!=="new"&&<div style={{marginBottom:14}}><div style={{fontSize:13,color:C.goldLight,fontWeight:500,fontFamily:FH,marginBottom:8}}>Linked Deals</div>{getSellerDeals(modal).length===0?<p style={{fontSize:12,color:C.textMuted}}>No deals linked yet.</p>:getSellerDeals(modal).map(d=><div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}><span style={{color:C.text}}>{d.address||"—"}</span><div style={{display:"flex",gap:6,alignItems:"center"}}><Badge color={STATUS_COLORS[d.status]}>{d.status}</Badge><span style={{color:C.green,fontWeight:600}}>{fmt$(d.profit)}</span><button style={{...btnSmall,padding:"3px 8px",fontSize:10}} onClick={()=>{setModal(null);nav("pipeline");}}>View</button></div></div>)}<select style={{...selectStyle,fontSize:11,padding:"6px 10px",marginTop:8}} onChange={e=>{if(e.target.value)linkDealToSeller(e.target.value,modal);e.target.value="";}}><option value="">+ Link a deal...</option>{deals.filter(d=>d.sellerId!==modal).map(d=><option key={d.id} value={d.id}>{d.address||"Unnamed deal"}</option>)}</select></div>}
        <div style={{display:"flex",gap:10}}><button style={btnStyle} onClick={()=>saveSeller(false)}>Save Seller</button>{dupWarning&&<button style={btnOutline} onClick={()=>saveSeller(true)}>Save Anyway</button>}</div>
      </Modal>}
      {contractModal&&<Modal title="Send Contract Email" onClose={()=>setContractModal(null)}>
        <FormField label="Template" full><select style={selectStyle} value={contractTemplate} onChange={e=>setContractTemplate(e.target.value)}>{Object.entries(TEMPLATES).map(([k,t])=><option key={k} value={k}>{t.title}</option>)}</select></FormField>
        <div style={{background:C.bgInput,border:`1px solid ${C.goldBorder}`,borderRadius:12,padding:16,marginTop:12,maxHeight:300,overflowY:"auto"}}><pre style={{whiteSpace:"pre-wrap",fontSize:12,color:C.textSec,lineHeight:1.6,margin:0,fontFamily:"inherit"}}>{fillTemplate(TEMPLATES[contractTemplate]?.content||"",contractModal)}</pre></div>
        <div style={{display:"flex",gap:10,marginTop:16}}>
          <a href={`mailto:${contractModal.email||""}?subject=${encodeURIComponent((contractModal.address||"Property")+" Proposal")}&body=${encodeURIComponent(fillTemplate(TEMPLATES[contractTemplate]?.content||"",contractModal))}`} style={{...btnStyle,textDecoration:"none",textAlign:"center",flex:1}} onClick={()=>setContractModal(null)}>Open in Email</a>
          <button style={{...btnOutline,flex:1}} onClick={()=>{navigator.clipboard.writeText(fillTemplate(TEMPLATES[contractTemplate]?.content||"",contractModal)).catch(()=>{});addToast("Copied to clipboard");setContractModal(null);}}>Copy to Clipboard</button>
        </div>
      </Modal>}
      {importModal&&<Modal title="Import PropStream Data" onClose={()=>setImportModal(false)}><p style={{fontSize:13,color:C.textSec,marginBottom:12}}>Paste: Name, Address, Phone, Email (one per line)</p><textarea style={{...textareaStyle,minHeight:160}} value={importText} onChange={e=>setImportText(e.target.value)} placeholder={"John Doe, 123 Main St, 555-1234, john@email.com"}/><button style={{...btnStyle,marginTop:12}} onClick={doImport}>Import Sellers</button></Modal>}
      <HelpButton pageId="sellers"/>
    </div>);
  };

  // ═══ CALL TRACKER + CALL MODE ═══
  const CallsPage = () => {
    const [modal,setModal]=useState(!!prefillCallId);const [form,setForm]=useState({leadId:prefillCallId||"",buyerId:"",date:todayStr(),time:new Date().toLocaleTimeString("en-US",{hour12:false,hour:"2-digit",minute:"2-digit"}),result:"Answered",notes:"",followUp:"",discussed:""});
    useEffect(()=>{if(prefillCallId){setForm(p=>({...p,leadId:prefillCallId}));setModal(true);setPrefillCallId("");}},[]);
    const RESULT_MAP={"Interested":"Interested","Voicemail":"Voicemail","Rejected":"Not Interested","Not Interested":"Not Interested","Answered":"Called"};
    const saveCall=()=>{const nc={...form,id:uid(),updatedAt:new Date().toISOString()};setCalls(p=>[nc,...p]);if(form.leadId){const newStatus=RESULT_MAP[form.result]||"Called";setSellers(p=>p.map(l=>l.id===form.leadId?{...l,status:newStatus,lastContact:form.date,updatedAt:new Date().toISOString(),...(form.followUp?{followUp:form.followUp}:{})}:l));}setModal(false);addToast("Call logged");};

    // ── Call Mode ──
    const [callMode,setCallMode]=useState(false);const [cmStep,setCmStep]=useState("pick");const [cmSeller,setCmSeller]=useState(null);const [cmDevice,setCmDevice]=useState(null);const [cmSearch,setCmSearch]=useState("");const [cmStage,setCmStage]=useState("opening");const [cmLastStatus,setCmLastStatus]=useState("");const [cmCheatOpen,setCmCheatOpen]=useState(true);const [cmTimer,setCmTimer]=useState(0);const cmTimerRef=useRef(null);
    useEffect(()=>{if(cmStep==="active"){setCmTimer(0);cmTimerRef.current=setInterval(()=>setCmTimer(t=>t+1),1000);return()=>clearInterval(cmTimerRef.current);}else{if(cmTimerRef.current)clearInterval(cmTimerRef.current);}},[cmStep]);
    const fmtTimer=(s)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
    const exitCallMode=()=>{setCallMode(false);setCmStep("pick");setCmSeller(null);setCmDevice(null);setCmStage("opening");setCmLastStatus("");setCmSearch("");setWhispers([]);setMicStatus("off");};
    const cmQuickStatus=(status)=>{if(!cmSeller)return;setSellers(p=>p.map(l=>l.id===cmSeller.id?{...l,status,lastContact:todayStr(),updatedAt:new Date().toISOString()}:l));setCmSeller(p=>({...p,status}));setCmLastStatus(status);addToast(`Status: ${status}`);};
    const cmEndCall=()=>{setForm({leadId:cmSeller?.id||"",buyerId:"",date:todayStr(),time:new Date().toLocaleTimeString("en-US",{hour12:false,hour:"2-digit",minute:"2-digit"}),result:cmLastStatus||"Answered",notes:"",followUp:"",discussed:""});setModal(true);setCallMode(false);setCmStep("pick");setCmDevice(null);setCmStage("opening");setCmLastStatus("");setCmSearch("");};

    // ── AI Transcription (other-device only) ──
    const [whispers,setWhispers]=useState([]);const [micStatus,setMicStatus]=useState("off");const [micPaused,setMicPaused]=useState(false);const [genSummary,setGenSummary]=useState(false);
    const transcriptRef=useRef("");const lastSentRef=useRef("");const recognitionRef=useRef(null);const aiIntervalRef=useRef(null);const lowConfCount=useRef(0);const noSpeechTimer=useRef(null);

    // Auto-remove unpinned whispers after 15s
    useEffect(()=>{if(!whispers.length)return;const t=setTimeout(()=>{setWhispers(p=>p.filter(w=>w.pinned||Date.now()-w.ts<15000));},5000);return()=>clearTimeout(t);},[whispers]);

    // Speech recognition + AI coaching
    useEffect(()=>{
      if(cmDevice!=="other"||cmStep!=="active"||!cmSeller)return;
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){setMicStatus("off");return;}
      try{
        const rec=new SR();rec.continuous=true;rec.interimResults=true;rec.lang="en-US";
        rec.onresult=(e)=>{let final="";for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal){final+=e.results[i][0].transcript+" ";if(e.results[i][0].confidence<0.6){lowConfCount.current++;if(lowConfCount.current>=3)setMicStatus("low");}else{lowConfCount.current=0;setMicStatus("active");}}}if(final)transcriptRef.current+=final;if(noSpeechTimer.current)clearTimeout(noSpeechTimer.current);noSpeechTimer.current=setTimeout(()=>setMicStatus("nospeech"),30000);};
        rec.onerror=(e)=>{if(e.error!=="no-speech")console.error("Speech error:",e.error);};
        rec.onend=()=>{if(cmStep==="active"&&!micPaused)try{rec.start();}catch(e){}};
        if(!micPaused){rec.start();setMicStatus("active");}
        recognitionRef.current=rec;

        // AI coaching interval
        aiIntervalRef.current=setInterval(async()=>{
          if(micPaused)return;
          const recent=transcriptRef.current.slice(lastSentRef.current.length);
          if(!recent.trim()||recent.length<10)return;
          lastSentRef.current=transcriptRef.current;
          try{
            const r=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:150,system:[{type:"text",text:`You are a silent real-time AI coach for a land wholesaling cold call. The caller works for JW Monarch buying vacant land in the Myrtle Beach / Horry County, SC market. The seller is: ${cmSeller.name}, property at ${cmSeller.address}. Previous notes: ${cmSeller.notes||"none"}. This is call #${cmSellerCalls.length+1}. Analyze the transcript and return ONLY valid JSON: {trigger (string or null), coaching (1-2 sentence instruction or null), advance_to (null|"opening"|"rapport"|"pitch"|"objections"|"close"), confidence (0-1)}. If nothing notable, return all nulls.`,cache_control:{type:"ephemeral"}}],messages:[{role:"user",content:`Recent transcript: ${recent}`}]})});
            const data=await r.json();const txt=data.content?.map(i=>i.text||"").filter(Boolean).join("")||"";
            const clean=txt.replace(/```json|```/g,"").trim();const parsed=JSON.parse(clean);
            if(parsed.trigger&&parsed.confidence>0.5){setWhispers(p=>{const next=[{id:uid(),trigger:parsed.trigger,coaching:parsed.coaching,ts:Date.now(),pinned:false},...p];return next.slice(0,4);});}
            if(parsed.advance_to&&parsed.advance_to!==cmStage)setCmStage(parsed.advance_to);
          }catch(e){console.error("AI coach error:",e);}
        },3000);

        return()=>{if(recognitionRef.current)try{recognitionRef.current.stop();}catch(e){}if(aiIntervalRef.current)clearInterval(aiIntervalRef.current);if(noSpeechTimer.current)clearTimeout(noSpeechTimer.current);};
      }catch(e){setMicStatus("off");}
    },[cmStep,cmDevice,cmSeller?.id,micPaused]);

    const toggleMicPause=()=>{setMicPaused(p=>{if(!p){if(recognitionRef.current)try{recognitionRef.current.stop();}catch(e){}setMicStatus("off");}else{if(recognitionRef.current)try{recognitionRef.current.start();setMicStatus("active");}catch(e){}}return!p;});};
    const pinWhisper=(id)=>setWhispers(p=>p.map(w=>w.id===id?{...w,pinned:!w.pinned}:w));
    const dismissWhisper=(id)=>setWhispers(p=>p.filter(w=>w.id!==id));

    const generateSummary=async()=>{
      if(!transcriptRef.current.trim()){addToast("No transcript to summarize","error");return;}
      setGenSummary(true);
      try{
        const r=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:200,system:[{type:"text",text:"You are summarizing a land wholesaling cold call for a CRM log. Be factual, brief, and practical.",cache_control:{type:"ephemeral"}}],messages:[{role:"user",content:`Seller: ${cmSeller?.name}, Address: ${cmSeller?.address}. Full transcript: ${transcriptRef.current}. Write 2-3 sentences covering: what was discussed, the seller's motivation or objections if any, and the agreed next step. Plain text only.`}]})});
        const data=await r.json();const txt=data.content?.map(i=>i.text||"").filter(Boolean).join("")||"";
        setForm(p=>({...p,discussed:txt}));addToast("Summary generated");
      }catch(e){addToast("Summary failed","error");}finally{setGenSummary(false);}
    };

    const SCRIPT={opening:{label:"Opening",text:`Hi [Name], this is (Your Name) calling about your property at [Address] — did I catch you at a bad time?`,branches:[{label:"Good time → continue",next:"rapport"},{label:"Bad time",next:"badtime"},{label:"No answer / Voicemail",action:"voicemail"}]},badtime:{label:"Opening",text:`When's a better time? I'll be quick — we buy land in your area for cash, no commissions.`,branches:[{label:"They give a time",next:"rapport"},{label:"Still not interested",next:"objections"}]},rapport:{label:"Rapport",text:`I work with JW Monarch — we've helped close over 500 land sales. Your property caught our attention. Have you ever thought about selling?`,branches:[{label:"Open to it",next:"pitch"},{label:"Tell me more",next:"pitch"},{label:"Not interested",next:"objections"}]},pitch:{label:"Pitch",text:`We pay cash, cover all closing costs, no realtor fees — whatever number we agree on is exactly what you receive at closing.\n\nIn a perfect world, what were you hoping to walk away with?`,branches:[{label:"Gave a number",next:"pitchfollow"},{label:"Price objection",next:"objections"},{label:"Need to think",next:"objections"},{label:"Sounds good",next:"close"}]},pitchfollow:{label:"Pitch",text:`That's helpful — let me run that by my underwriters. If we can get close, would you be ready to move forward today?`,branches:[{label:"Yes",next:"close"},{label:"Need to think",next:"objections"},{label:"Number is firm",next:"objections"}]},objections:{label:"Objections",text:`Common objections — tap the one you're hearing:`,branches:[{label:'"Offer too low"',next:"obj_low"},{label:'"Need to think"',next:"obj_think"},{label:'"List with realtor"',next:"obj_realtor"},{label:'"How did you get my number?"',next:"obj_number"},{label:'"Not interested" (firm)',next:"obj_firm"}]},obj_low:{label:"Objections",text:`I understand. Our offers are based on recent comps and market conditions. What number did you have in mind?`,branches:[{label:"They give a number",next:"pitchfollow"},{label:"Still too low",next:"obj_firm"}]},obj_think:{label:"Objections",text:`Absolutely. I can send you a written offer so you have something concrete. What email should I send it to?`,branches:[{label:"Gave email",next:"close"},{label:"Will call back",next:"obj_firm"}]},obj_realtor:{label:"Objections",text:`That's a great option too. With us there are no commissions, no showings, and we close on your timeline. Worth comparing both.`,branches:[{label:"Open to comparing",next:"pitch"},{label:"Going with realtor",next:"obj_firm"}]},obj_number:{label:"Objections",text:`Your property is public record, and we reach out to landowners in areas where our buyers are looking. No pressure at all.`,branches:[{label:"OK, tell me more",next:"pitch"},{label:"Not interested",next:"obj_firm"}]},obj_firm:{label:"Objections",text:`Completely understand. If circumstances change, we'd love to be your first call. Can I check back in a few months?`,branches:[{label:"Yes, follow up later",action:"followup"},{label:"No, remove me",action:"end"}]},close:{label:"Close",text:`Great — let me get your email so I can send the agreement. Simple one-page DocuSign. What's the best email?`,branches:[{label:"Gave email",next:"closefinal"},{label:"Not ready yet",next:"closedelay"}]},closefinal:{label:"Close",text:`Perfect — you'll receive it within the hour. Congratulations on taking this step!`,branches:[{label:"End call → Under Contract",action:"contract"}]},closedelay:{label:"Close",text:`Completely understood. When would be a good time to follow up?`,branches:[{label:"Set follow-up",action:"followup"}]}};
    const curScript=SCRIPT[cmStage]||SCRIPT.opening;const stageOrder=["opening","rapport","pitch","objections","close"];const stageIdx=stageOrder.indexOf(curScript.label.toLowerCase());
    const handleBranch=(b)=>{if(b.next)setCmStage(b.next);else if(b.action==="voicemail"){cmQuickStatus("Voicemail");cmEndCall();}else if(b.action==="contract"){cmQuickStatus("Under Contract");cmEndCall();}else if(b.action==="followup"){cmQuickStatus("Interested");cmEndCall();}else if(b.action==="end")cmEndCall();};
    const cmSellerCalls=cmSeller?calls.filter(c=>c.leadId===cmSeller.id):[];const cmLastCall=cmSellerCalls[0];const cmLinkedDeal=cmSeller?deals.find(d=>d.sellerId===cmSeller.id):null;
    const filledText=cmSeller?fillTemplate(curScript.text,cmSeller):curScript.text;
    const cmFiltered=sellers.filter(s=>!s.archived).filter(s=>{if(!cmSearch)return true;const q=cmSearch.toLowerCase();return(s.name||"").toLowerCase().includes(q)||(s.address||"").toLowerCase().includes(q)||(s.phone||"").includes(q);});

    if(callMode){
      if(cmStep==="pick") return(<div><TopBar title="Call Mode"/><div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button style={btnOutline} onClick={exitCallMode}>← Back to Log</button></div><Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Select a Seller to Call</div><input style={{...inputStyle,marginBottom:14}} placeholder="Search sellers..." value={cmSearch} onChange={e=>setCmSearch(e.target.value)}/><div style={{maxHeight:400,overflowY:"auto"}}>{cmFiltered.length===0?<p style={{color:C.textMuted,fontSize:13}}>No sellers found.</p>:cmFiltered.slice(0,20).map(s=><div key={s.id} onClick={()=>{setCmSeller(s);setCmStep("device");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:`1px solid ${C.goldBorder}`,cursor:"pointer",borderRadius:8}} onMouseEnter={e=>e.currentTarget.style.background="rgba(212,175,55,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><div><div style={{fontWeight:500,color:C.text}}>{s.name||"Unknown"}</div><div style={{fontSize:12,color:C.textMuted}}>{s.address}</div></div><div style={{display:"flex",alignItems:"center",gap:10}}><Badge color={STATUS_COLORS[s.status]}>{s.status}</Badge>{s.phone&&<span style={{fontSize:12,color:C.gold}}>{s.phone}</span>}</div></div>)}</div></Card></div>);

      if(cmStep==="device") return(<div><TopBar title="Call Mode"/><div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button style={btnOutline} onClick={()=>setCmStep("pick")}>← Back</button></div><Card style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:22,color:C.goldLight,fontFamily:FH,marginBottom:4}}>{cmSeller?.name||"Unknown"}</div>{cmSeller?.phone&&<a href={`tel:${cmSeller.phone}`} style={{fontSize:18,color:C.gold,textDecoration:"none"}}>{cmSeller.phone}</a>}</Card><div className="dash-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}><Card style={{cursor:"pointer"}} onClick={()=>{setCmDevice("this");setCmStep("active");}}><div style={{fontSize:28,marginBottom:12}}>📱</div><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:6}}>Calling from this device</div><div style={{fontSize:12,color:C.textMuted,marginBottom:14}}>Phone on speaker, Monarch OS open here</div>{["Script Navigator","Seller Cheat Sheet","Quick status buttons","Post-call logging"].map(f=><div key={f} style={{fontSize:12,color:C.textMuted,padding:"3px 0"}}>✓ {f}</div>)}</Card><Card style={{cursor:"pointer",border:`1px solid ${C.gold}40`}} onClick={()=>{setCmDevice("other");setCmStep("active");}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:28}}>💻</span><span style={{fontSize:10,color:C.gold,fontWeight:600,letterSpacing:1}}>✦ RECOMMENDED</span></div><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:6}}>Calling from another device</div><div style={{fontSize:12,color:C.textMuted,marginBottom:14}}>Phone separate, Monarch OS on laptop</div>{["Everything above","Live AI transcription (Part B)","Real-time objection detection","Auto-generated summary"].map(f=><div key={f} style={{fontSize:12,color:C.textMuted,padding:"3px 0"}}>✓ {f}</div>)}</Card></div></div>);

      // ── ACTIVE CALL ──
      return(<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:10,height:10,borderRadius:5,background:C.green,animation:"pulse 2s infinite"}}/><div style={{fontSize:18,color:C.gold,fontFamily:FH}}>{fmtTimer(cmTimer)}</div><span style={{fontSize:12,color:C.textMuted}}>with {cmSeller?.name||"Unknown"}</span></div><button style={{...btnDanger,padding:"10px 24px"}} onClick={cmEndCall}>End Call & Log</button></div>
        <div style={cmDevice==="other"?{display:"grid",gridTemplateColumns:"320px 1fr",gap:18}:{maxWidth:520,margin:"0 auto"}}>
          <div>
            <Card style={{marginBottom:14}}><div onClick={()=>setCmCheatOpen(!cmCheatOpen)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}><div style={{fontSize:13,color:C.gold,fontWeight:600,letterSpacing:1}}>SELLER INFO</div><span style={{color:C.textMuted,fontSize:12}}>{cmCheatOpen?"▾":"▸"}</span></div>{cmCheatOpen&&<div style={{marginTop:12}}><div style={{fontSize:20,color:C.goldLight,fontFamily:FH}}>{cmSeller?.name||"Unknown"}</div><div style={{fontSize:13,color:C.textSec,marginTop:2}}>{cmSeller?.address}</div><div style={{display:"flex",gap:8,marginTop:8}}><Badge color={STATUS_COLORS[cmSeller?.status]}>{cmSeller?.status}</Badge><span style={{fontSize:12,color:C.textMuted}}>Called {cmSellerCalls.length}x before</span></div>{cmLastCall&&<div style={{marginTop:8,fontSize:12,color:C.textMuted}}>Last: {fmtDate(cmLastCall.date)} — <Badge color={STATUS_COLORS[cmLastCall.result]}>{cmLastCall.result}</Badge>{cmLastCall.discussed&&<div style={{marginTop:4,color:C.textSec}}>{cmLastCall.discussed.slice(0,120)}</div>}</div>}{cmSeller?.notes&&<div style={{marginTop:8,fontSize:12,color:C.textSec,borderTop:`1px solid ${C.goldBorder}`,paddingTop:8}}>{cmSeller.notes.slice(0,160)}</div>}{cmLinkedDeal&&<div style={{marginTop:8,fontSize:12,color:C.gold}}>Deal: {cmLinkedDeal.address} — <Badge color={STATUS_COLORS[cmLinkedDeal.status]}>{cmLinkedDeal.status}</Badge></div>}</div>}</Card>
            {cmDevice==="other"&&<Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:8,height:8,borderRadius:4,background:micStatus==="active"?C.green:micStatus==="low"?C.orange:C.textMuted,animation:micStatus==="active"?"pulse 2s infinite":"none"}}/>
                  <span style={{fontSize:12,color:micStatus==="active"?C.green:micStatus==="low"?C.orange:C.textMuted}}>{micStatus==="active"?"Listening...":micStatus==="low"?"Low confidence":micStatus==="nospeech"?"No audio detected":"Mic off"}</span>
                </div>
                <button onClick={toggleMicPause} style={{...btnOutline,padding:"4px 12px",fontSize:11}}>{micPaused?"Resume":"Pause"}</button>
              </div>
              {micStatus==="nospeech"&&<p style={{fontSize:11,color:C.orange,margin:"0 0 8px"}}>Is speaker volume up?</p>}
              {!(window.SpeechRecognition||window.webkitSpeechRecognition)&&<p style={{fontSize:12,color:C.orange}}>Live transcription requires Chrome.</p>}
              {whispers.length===0?<p style={{fontSize:12,color:C.textMuted}}>Whisper cards will appear when the AI detects objections or coaching opportunities...</p>:whispers.map(w=><div key={w.id} style={{background:"rgba(212,175,55,0.06)",border:`1px solid ${C.goldBorder}`,borderRadius:10,padding:"10px 14px",marginBottom:8,fontSize:13,opacity:1,transition:"opacity 0.3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:11,color:C.textMuted}}>{w.trigger}</span><div style={{display:"flex",gap:6}}><span onClick={()=>pinWhisper(w.id)} style={{cursor:"pointer",fontSize:11,color:w.pinned?C.gold:C.textMuted}}>{w.pinned?"📌":"Pin"}</span><span onClick={()=>dismissWhisper(w.id)} style={{cursor:"pointer",fontSize:11,color:C.textMuted}}>×</span></div></div>
                <div style={{color:C.text}}>{w.coaching}</div>
              </div>)}
            </Card>}
          </div>
          <div>
            <Card style={{marginBottom:14}}><div style={{display:"flex",gap:2,marginBottom:14}}>{stageOrder.map((s,i)=><div key={s} style={{flex:1,height:4,borderRadius:2,background:i<=stageIdx?C.gold:"rgba(255,255,255,0.06)",cursor:"pointer"}} onClick={()=>setCmStage(s)}/>)}</div><div style={{fontSize:11,color:C.textMuted,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>{curScript.label}</div><div style={{fontSize:15,color:C.text,lineHeight:1.8,marginBottom:18,whiteSpace:"pre-wrap"}}>{filledText}</div>{curScript.branches.map((b,i)=><button key={i} onClick={()=>handleBranch(b)} style={{width:"100%",padding:"14px 20px",borderRadius:12,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.goldBorder}`,color:C.text,fontSize:14,textAlign:"left",cursor:"pointer",marginBottom:8,fontFamily:"inherit"}}>{b.label}</button>)}{cmStage!=="opening"&&<div onClick={()=>setCmStage("opening")} style={{fontSize:12,color:C.textMuted,cursor:"pointer",marginTop:8}}>← Back to start</div>}</Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,...(cmDevice==="this"?{position:"sticky",bottom:0,background:C.bg,paddingTop:12,paddingBottom:12}:{})}}><button onClick={()=>cmQuickStatus("Interested")} style={{padding:16,fontSize:15,borderRadius:14,background:"rgba(52,199,89,0.15)",color:C.green,border:"1px solid rgba(52,199,89,0.3)",cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>✓ Interested</button><button onClick={()=>cmQuickStatus("Not Interested")} style={{padding:16,fontSize:15,borderRadius:14,background:"rgba(229,57,53,0.12)",color:C.red,border:"1px solid rgba(229,57,53,0.25)",cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>✗ Not Interested</button><button onClick={()=>cmQuickStatus("Voicemail")} style={{padding:16,fontSize:15,borderRadius:14,background:"rgba(107,101,96,0.2)",color:C.textSec,border:`1px solid ${C.goldBorder}`,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>📬 Voicemail</button><button onClick={()=>cmQuickStatus("Called")} style={{padding:16,fontSize:15,borderRadius:14,background:C.goldMuted,color:C.gold,border:`1px solid ${C.goldBorder}`,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>📞 Called</button></div>
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>);
    }

    // ── Normal Call Log ──
    return(<div><TopBar title="Call Tracker"/><div style={{display:"flex",justifyContent:"flex-end",gap:10,marginBottom:18}}>
      <button style={{...btnStyle,background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,display:"flex",alignItems:"center",gap:6}} onClick={()=>{setCallMode(true);setCmStep("pick");}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B0B0F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> Call Mode</button>
      <button style={btnStyle} onClick={()=>{setForm({leadId:"",buyerId:"",date:todayStr(),time:new Date().toLocaleTimeString("en-US",{hour12:false,hour:"2-digit",minute:"2-digit"}),result:"Answered",notes:"",followUp:"",discussed:""});setModal(true);}}>+ Log Call</button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14,marginBottom:22}}>{[{v:calls.length,l:"Total Calls",c:C.blue},{v:weekCalls.length,l:"This Week",c:C.orange},{v:calls.filter(c=>c.result==="Interested").length,l:"Interested",c:C.green}].map((s,i)=>(<Card key={i} style={{padding:18,textAlign:"center"}}><div style={{fontSize:28,fontWeight:400,color:s.c,fontFamily:FH}}>{s.v}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>{s.l}</div></Card>))}</div>
      {calls.length===0?<EmptyState icon="◇" msg="No calls logged yet."/>:<Card style={{padding:0,overflow:"hidden"}}><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:"16px 0 0 0"}}>Seller</th><th style={thStyle}>Date</th><th style={thStyle}>Time</th><th style={thStyle}>Result</th><th style={{...thStyle,borderRadius:"0 16px 0 0"}}>Notes</th></tr></thead><tbody>{calls.slice(0,30).map(c=>{const l=sellers.find(x=>x.id===c.leadId);return(<tr key={c.id}><td style={tdStyle}>{l?l.name||l.address||l.phone:"—"}</td><td style={tdStyle}>{fmtDate(c.date)}</td><td style={tdStyle}>{c.time||"—"}</td><td style={tdStyle}><Badge color={STATUS_COLORS[c.result]}>{c.result}</Badge></td><td style={tdStyle}><span style={{fontSize:12,color:C.textMuted}}>{c.discussed||c.notes||"—"}</span></td></tr>);})}</tbody></table></Card>}
      {modal&&<Modal title="Log Call" onClose={()=>setModal(false)}><FormField label="Seller" full><select style={selectStyle} value={form.leadId} onChange={e=>setForm(p=>({...p,leadId:e.target.value}))}><option value="">— Select Seller —</option>{sellers.map(l=><option key={l.id} value={l.id}>{l.name||l.address||l.phone}</option>)}</select></FormField><FormField label="Linked Buyer (optional)" full><select style={selectStyle} value={form.buyerId||""} onChange={e=>setForm(p=>({...p,buyerId:e.target.value}))}><option value="">— None —</option>{activeBuyers.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></FormField><div style={formRow}><FormField label="Date"><input style={inputStyle} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></FormField><FormField label="Time"><input style={inputStyle} type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Result"><select style={selectStyle} value={form.result} onChange={e=>setForm(p=>({...p,result:e.target.value}))}>{["Answered","Voicemail","Rejected","Interested","Not Interested"].map(s=><option key={s}>{s}</option>)}</select></FormField><FormField label="Follow-Up"><input style={inputStyle} type="date" value={form.followUp} onChange={e=>setForm(p=>({...p,followUp:e.target.value}))}/></FormField></div><FormField label={<>What Was Discussed {form.discussed&&transcriptRef.current&&<span style={{fontSize:10,color:C.gold}}>✦ AI</span>}</>} full><textarea style={textareaStyle} value={form.discussed} onChange={e=>setForm(p=>({...p,discussed:e.target.value}))}/></FormField>{transcriptRef.current&&<button onClick={generateSummary} disabled={genSummary} style={{...btnOutline,marginBottom:12,width:"100%",opacity:genSummary?0.5:1}}>{genSummary?"Generating...":"✨ Generate Summary"}</button>}<FormField label="Notes / Objections" full><textarea style={textareaStyle} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormField><button style={btnStyle} onClick={saveCall}>Save Call</button></Modal>}
      <HelpButton pageId="calls"/>
    </div>);
  };

  // ═══ DEAL ANALYZER ═══
  const AnalyzerPage = () => {
    const [f,setF]=useState({address:"",acres:"",fmv:"",buyerPrice:"",offerPct:60});
    const [aiResult,setAiResult]=useState(null);const [aiLoading,setAiLoading]=useState(false);const [aiError,setAiError]=useState("");
    const [showManual,setShowManual]=useState(false);
    const offerPrice=Number(f.fmv||0)*(f.offerPct/100);const actualProfit=Number(f.buyerPrice||0)-offerPrice;const buyerSavings=Number(f.fmv||0)-Number(f.buyerPrice||0);
    const hasFMV=!!f.fmv;
    const saveToPipeline=()=>{if(!f.fmv)return;setDeals(p=>[{id:uid(),address:f.address,acres:f.acres,fmv:f.fmv,offerPrice:offerPrice.toFixed(0),buyerPrice:f.buyerPrice,profit:actualProfit.toFixed(0),status:"Prospect",buyerId:"",sellerId:"",dateEntered:todayStr(),targetClose:"",notes:"",...(aiResult?{aiEstimate:aiResult}:{}),updatedAt:new Date().toISOString()},...p]);setPage("pipeline");addToast("Saved to pipeline");};
    const saveAiToDeal=(dealId)=>{if(!aiResult)return;setDeals(p=>p.map(d=>d.id===dealId?{...d,aiEstimate:aiResult,fmv:String(aiResult.estimated_fmv_high||d.fmv)}:d));addToast("AI estimate saved to deal");};
    const matchedBuyers=activeBuyers.filter(b=>{if(offerPrice<=0)return false;if(Number(b.maxPrice||0)<offerPrice)return false;if(f.address&&b.locations){const locs=b.locations.toLowerCase().split(",").map(x=>x.trim());if(locs.some(loc=>f.address.toLowerCase().includes(loc)))return true;}return !f.address&&Number(b.maxPrice||0)>=offerPrice;});

    const runAiEstimate=async()=>{
      if(!f.address.trim()){addToast("Enter an address first","error");return;}
      setAiLoading(true);setAiError("");setAiResult(null);
      try{
        const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,
            tools:[{type:"web_search_20250305",name:"web_search"}],
            system:"You are a land valuation assistant specializing in the Myrtle Beach and Horry County, South Carolina market. Always search the web for current data.",
            messages:[{role:"user",content:`Analyze this property for land valuation: ${f.address}. Search for and return ONLY a JSON object (no markdown, no explanation) with these exact fields: redfin_estimate (number or null), redfin_derived (half of redfin_estimate, or null), comparable_sales_avg (number or null), county_assessed (number or null), estimated_fmv_low (number), estimated_fmv_high (number), price_per_acre (number or null), confidence ("high"|"medium"|"low"), hoa ("yes"|"no"|"unknown"), hoa_name (string or null), lot_type ("flag"|"normal"|"unknown"), zoning (string or null), buildable ("likely"|"unlikely"|"unknown"), flood_zone (string or null), wetlands ("flagged"|"none"|"unknown"), ciac ("paid"|"unpaid"|"unknown — verify with local utility"), sources (array of strings), notes (string)`}]
          })});
        const data=await res.json();
        const text=data.content?.map(i=>i.text||"").filter(Boolean).join("\n")||"";
        const clean=text.replace(/```json|```/g,"").trim();
        const parsed=JSON.parse(clean);
        setAiResult(parsed);
        // Auto-populate FMV
        if(parsed.estimated_fmv_high) setF(p=>({...p,fmv:String(parsed.estimated_fmv_high)}));
        if(parsed.price_per_acre&&parsed.estimated_fmv_high&&!f.acres){const estAcres=(parsed.estimated_fmv_high/parsed.price_per_acre).toFixed(2);setF(p=>({...p,acres:estAcres}));}
        addToast("AI estimate complete");
      }catch(err){
        console.error("AI estimate error:",err);
        setAiError("Estimate unavailable — try again or enter values manually.");
        setShowManual(true);
      }finally{setAiLoading(false);}
    };
    const flagColor=(v)=>v==="likely"||v==="none"||v==="paid"||v==="no"||v==="normal"?C.green:v==="unlikely"||v==="flagged"||v==="unpaid"||v==="yes"||v==="flag"?C.red:C.textMuted;

    return(<div><TopBar title="Deal Calculator"/>
      {/* Step 1: Address */}
      <Card style={{marginBottom:18}}>
        <div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Property Address</div>
        <input style={{...inputStyle,fontSize:16,padding:"14px 18px"}} value={f.address} onChange={e=>setF(p=>({...p,address:e.target.value}))} placeholder="Enter property address..."/>
        <div style={{display:"flex",gap:10,marginTop:14}}>
          <button onClick={runAiEstimate} disabled={aiLoading} style={{...btnStyle,flex:1,opacity:aiLoading?0.5:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{aiLoading?<><span style={{display:"inline-block",width:14,height:14,border:"2px solid #0B0B0F",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Analyzing...</>:"✦ AI Estimate"}</button>
          {!showManual&&!hasFMV&&<button onClick={()=>setShowManual(true)} style={{...btnOutline,whiteSpace:"nowrap"}}>Enter Manually</button>}
        </div>
      </Card>

      {/* AI Results */}
      {aiError&&<Card style={{marginBottom:18,borderColor:C.red+"40"}}><p style={{color:C.red,margin:0,fontSize:13}}>{aiError}</p></Card>}
      {aiResult&&<Card style={{marginBottom:18,borderColor:C.gold+"30"}}>
        <div style={{fontSize:16,color:C.goldLight,fontWeight:500,fontFamily:FH,marginBottom:16}}>AI Property Estimate <span style={{fontSize:11,color:C.textMuted,fontWeight:400,fontFamily:FB}}>— verify independently</span></div>
        <div className="dash-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
          <div>
            <div style={{fontSize:13,color:C.gold,fontWeight:600,marginBottom:10}}>Valuation</div>
            {[["Redfin Estimate",aiResult.redfin_estimate],["Redfin Derived (50%)",aiResult.redfin_derived],["Comparable Sales Avg",aiResult.comparable_sales_avg],["County Assessed",aiResult.county_assessed],["Est. FMV Low",aiResult.estimated_fmv_low],["Est. FMV High",aiResult.estimated_fmv_high],["Price/Acre",aiResult.price_per_acre]].map(([label,val])=><div key={label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}><span style={{color:C.textSec}}>{label}</span><span style={{color:C.text,fontWeight:500}}>{val!=null?fmt$(val):"—"}</span></div>)}
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:12}}><span style={{color:C.textSec}}>Confidence</span><Badge color={aiResult.confidence==="high"?C.green:aiResult.confidence==="medium"?C.orange:C.red}>{aiResult.confidence}</Badge></div>
          </div>
          <div>
            <div style={{fontSize:13,color:C.gold,fontWeight:600,marginBottom:10}}>Property Flags</div>
            {[["HOA",aiResult.hoa],["Lot Type",aiResult.lot_type],["Zoning",aiResult.zoning||"unknown"],["Buildable",aiResult.buildable],["Flood Zone",aiResult.flood_zone||"unknown"],["Wetlands",aiResult.wetlands],["CIAC",aiResult.ciac]].map(([label,val])=><div key={label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}><span style={{color:C.textSec}}>{label}</span><span style={{color:flagColor(val),fontWeight:500}}>{val||"—"}</span></div>)}
            {aiResult.hoa_name&&<div style={{fontSize:11,color:C.textMuted,marginTop:6}}>HOA: {aiResult.hoa_name}</div>}
          </div>
        </div>
        {aiResult.sources?.length>0&&<div style={{marginTop:14}}><div style={{fontSize:11,color:C.textMuted,letterSpacing:1,marginBottom:6}}>SOURCES</div>{aiResult.sources.map((s,i)=><div key={i} style={{fontSize:11,color:C.textSec,padding:"2px 0"}}>• {s}</div>)}</div>}
        {aiResult.notes&&<div style={{marginTop:10,fontSize:12,color:C.textSec,fontStyle:"italic"}}>{aiResult.notes}</div>}
        {deals.length>0&&<div style={{marginTop:14}}><FormField label="Save AI Estimate to Existing Deal" full><select style={{...selectStyle,fontSize:12}} onChange={e=>{if(e.target.value){saveAiToDeal(e.target.value);e.target.value="";}}}><option value="">— Select a deal —</option>{deals.map(d=><option key={d.id} value={d.id}>{d.address||"Unnamed"} ({d.status})</option>)}</select></FormField></div>}
      </Card>}

      {/* Step 2: Deal Math (shows after AI fills FMV or manual entry) */}
      {(hasFMV||showManual)&&<div className="dash-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <Card>
          <div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Deal Details</div>
          <div style={formRow}><FormField label="Acres"><input style={inputStyle} type="number" value={f.acres} onChange={e=>setF(p=>({...p,acres:e.target.value}))}/></FormField><FormField label="Fair Market Value"><input style={inputStyle} type="number" value={f.fmv} onChange={e=>setF(p=>({...p,fmv:e.target.value}))}/></FormField></div>
          <FormField label="Buyer Price" full><input style={inputStyle} type="number" value={f.buyerPrice} onChange={e=>setF(p=>({...p,buyerPrice:e.target.value}))}/></FormField>
          <FormField label={`Offer % of FMV: ${f.offerPct}%`} full><input type="range" min="30" max="90" value={f.offerPct} onChange={e=>setF(p=>({...p,offerPct:Number(e.target.value)}))} style={{width:"100%",accentColor:C.gold}}/></FormField>
        </Card>
        <Card>
          <div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Output</div>
          <div style={{display:"grid",gap:22}}>
            <div><div style={{fontSize:11,color:C.textSec,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Recommended Offer</div><div style={{fontSize:32,fontWeight:400,color:C.goldLight,fontFamily:FH}}>{fmt$(offerPrice)}</div></div>
            <div><div style={{fontSize:11,color:C.textSec,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Your Profit</div><div style={{fontSize:32,fontWeight:400,color:actualProfit>0?C.green:C.red,fontFamily:FH}}>{fmt$(actualProfit)}</div></div>
            <div><div style={{fontSize:11,color:C.textSec,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Buyer Savings vs FMV</div><div style={{fontSize:22,color:C.text}}>{fmt$(Math.abs(buyerSavings))}</div></div>
            {f.acres&&f.fmv&&<div><div style={{fontSize:11,color:C.textSec,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Price/Acre</div><div style={{fontSize:18,color:C.textSec}}>{fmt$(Number(f.fmv)/Number(f.acres))}/ac</div></div>}
          </div>
          <button style={{...btnStyle,marginTop:24,width:"100%"}} onClick={saveToPipeline}>Save to Pipeline</button>
        </Card>
      </div>}

      {/* Buyer Match Preview */}
      {hasFMV&&<Card style={{marginTop:18}}>
        <div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:12}}>Matching Buyers</div>
        {matchedBuyers.length===0?<p style={{color:C.textMuted,fontSize:13}}>No buyers match these criteria yet.</p>:<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{matchedBuyers.map(b=><Badge key={b.id} color={C.green}>{b.name} — max {fmt$(b.maxPrice)}</Badge>)}</div>}
      </Card>}
      <HelpButton pageId="calculator"/></div>);
  };

  // ═══ DEAL PIPELINE (PERSONAL) ═══
  const PipelinePage = () => {
    const [modal,setModal]=useState(null);const [aiModal,setAiModal]=useState(null);const [actNote,setActNote]=useState("");
    const blank={address:"",acres:"",fmv:"",offerPrice:"",buyerPrice:"",profit:"",status:"Prospect",buyerId:"",sellerId:"",dateEntered:todayStr(),targetClose:"",notes:"",activity:[]};const [form,setForm]=useState(blank);const [filter,setFilter]=useState("All");
    const saveDeal=()=>{const now=new Date().toISOString();let activity=[...(form.activity||[])];
      if(modal!=="new"){const old=deals.find(d=>d.id===modal);if(old&&old.status!==form.status)activity.push({id:uid(),date:now,type:"Status Change",note:`Status changed to ${form.status}`});}
      const d={...form,activity,profit:(Number(form.buyerPrice||0)-Number(form.offerPrice||0)).toString(),updatedAt:now};if(modal==="new")setDeals(p=>[{...d,id:uid()},...p]);else setDeals(p=>p.map(x=>x.id===modal?{...x,...d}:x));setModal(null);setActNote("");addToast("Deal saved");};
    const addActivity=()=>{if(!actNote.trim())return;setForm(p=>({...p,activity:[...(p.activity||[]),{id:uid(),date:new Date().toISOString(),type:"Note",note:actNote}]}));setActNote("");};
    const del=id=>setDeals(p=>p.filter(d=>d.id!==id));const filtered=filter==="All"?deals:deals.filter(d=>d.status===filter);
    const getSellerName=(sid)=>{const s=sellers.find(x=>x.id===sid);return s?(s.name||s.address||s.phone):"";};
    const flagColor=(v)=>v==="likely"||v==="none"||v==="paid"||v==="no"||v==="normal"?C.green:v==="unlikely"||v==="flagged"||v==="unpaid"||v==="yes"||v==="flag"?C.red:C.textMuted;
    const actColor={Note:C.gold,"Status Change":C.blue,Call:C.green};
    return(<div><TopBar title="Deal Pipeline"/><div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button style={btnStyle} onClick={()=>{setForm(blank);setModal("new");}}>+ Add Deal</button></div>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>{["All",...DEAL_STATUSES].map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:"7px 18px",borderRadius:10,border:`1px solid ${filter===s?C.gold:C.goldBorder}`,background:filter===s?"rgba(212,175,55,0.1)":"transparent",color:filter===s?C.gold:C.textSec,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>)}</div>
      {filtered.length===0?<EmptyState icon="◇" msg="No deals in pipeline."/>:<Card style={{padding:0,overflow:"hidden"}}><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:"16px 0 0 0"}}>Property</th><th style={thStyle}>Seller</th><th style={thStyle}>Offer</th><th style={thStyle}>Profit</th><th style={thStyle}>Status</th><th style={{...thStyle,borderRadius:"0 16px 0 0"}}>Actions</th></tr></thead><tbody>{filtered.map(d=>{const sn=getSellerName(d.sellerId);return<tr key={d.id}><td style={tdStyle}><div><span style={{fontWeight:500}}>{d.address||"—"}</span>{d.acres&&<div style={{fontSize:11,color:C.textMuted}}>{d.acres} ac</div>}{d.aiEstimate&&<span onClick={()=>setAiModal(d)} style={{cursor:"pointer"}}><Badge color={C.purple}>AI</Badge></span>}</div></td><td style={tdStyle}>{sn?<span style={{color:C.gold,cursor:"pointer",fontSize:12}} onClick={()=>nav("sellers")}>{sn}</span>:<span style={{color:C.textMuted}}>—</span>}</td><td style={tdStyle}>{fmt$(d.offerPrice)}</td><td style={tdStyle}><span style={{color:Number(d.profit)>0?C.green:C.red,fontWeight:600}}>{fmt$(d.profit)}</span></td><td style={tdStyle}><Badge color={STATUS_COLORS[d.status]}>{d.status}</Badge></td><td style={tdStyle}><div style={{display:"flex",gap:6}}><button style={btnSmall} onClick={()=>{setForm({...d,activity:d.activity||[]});setModal(d.id);}}>Edit</button><button style={btnDanger} onClick={()=>del(d.id)}>Del</button></div></td></tr>})}</tbody></table></Card>}
      {modal&&<Modal title={modal==="new"?"Add Deal":"Edit Deal"} onClose={()=>{setModal(null);setActNote("");}}>
        <FormField label="Property Address" full><input style={inputStyle} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></FormField><div style={formRow}><FormField label="Acres"><input style={inputStyle} type="number" value={form.acres} onChange={e=>setForm(p=>({...p,acres:e.target.value}))}/></FormField><FormField label="FMV"><input style={inputStyle} type="number" value={form.fmv} onChange={e=>setForm(p=>({...p,fmv:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Your Offer"><input style={inputStyle} type="number" value={form.offerPrice} onChange={e=>setForm(p=>({...p,offerPrice:e.target.value}))}/></FormField><FormField label="Buyer Price"><input style={inputStyle} type="number" value={form.buyerPrice} onChange={e=>setForm(p=>({...p,buyerPrice:e.target.value}))}/></FormField></div><div style={formRow}><FormField label="Status"><select style={selectStyle} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{DEAL_STATUSES.map(s=><option key={s}>{s}</option>)}</select></FormField><FormField label="Buyer"><select style={selectStyle} value={form.buyerId} onChange={e=>setForm(p=>({...p,buyerId:e.target.value}))}><option value="">— None —</option>{activeBuyers.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></FormField></div><FormField label="Linked Seller" full><select style={selectStyle} value={form.sellerId||""} onChange={e=>setForm(p=>({...p,sellerId:e.target.value}))}><option value="">— None —</option>{sellers.filter(s=>!s.archived).map(s=><option key={s.id} value={s.id}>{s.name||s.address||s.phone}</option>)}</select></FormField><div style={formRow}><FormField label="Date Entered"><input style={inputStyle} type="date" value={form.dateEntered} onChange={e=>setForm(p=>({...p,dateEntered:e.target.value}))}/></FormField><FormField label="Target Close"><input style={inputStyle} type="date" value={form.targetClose} onChange={e=>setForm(p=>({...p,targetClose:e.target.value}))}/></FormField></div><FormField label="Notes" full><textarea style={textareaStyle} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormField>
        {/* Activity Log */}
        {modal!=="new"&&<div style={{marginTop:8,marginBottom:14}}>
          <div style={{fontSize:13,color:C.goldLight,fontWeight:500,fontFamily:FH,marginBottom:10}}>Activity Log</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}><input style={{...inputStyle,flex:1}} placeholder="Add a note..." value={actNote} onChange={e=>setActNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addActivity()}/><button style={btnSmall} onClick={addActivity}>Add</button></div>
          {(form.activity||[]).length===0?<p style={{fontSize:12,color:C.textMuted}}>No activity yet.</p>:[...(form.activity||[])].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,15).map(a=><div key={a.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}><div style={{minWidth:70,color:C.textMuted}}>{fmtDate(a.date?.split("T")[0])}</div><Badge color={actColor[a.type]||C.gold}>{a.type}</Badge><div style={{color:C.text,flex:1}}>{a.note}</div></div>)}
        </div>}
        <button style={btnStyle} onClick={saveDeal}>Save Deal</button>
      </Modal>}
      {aiModal&&<Modal title="AI Property Estimate" onClose={()=>setAiModal(null)}>
        <div className="dash-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
          <div><div style={{fontSize:13,color:C.gold,fontWeight:600,marginBottom:10}}>Valuation</div>{[["Redfin Estimate",aiModal.aiEstimate?.redfin_estimate],["Redfin Derived (50%)",aiModal.aiEstimate?.redfin_derived],["Comparable Sales",aiModal.aiEstimate?.comparable_sales_avg],["County Assessed",aiModal.aiEstimate?.county_assessed],["Est. FMV Low",aiModal.aiEstimate?.estimated_fmv_low],["Est. FMV High",aiModal.aiEstimate?.estimated_fmv_high],["Price/Acre",aiModal.aiEstimate?.price_per_acre]].map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}><span style={{color:C.textSec}}>{l}</span><span style={{color:C.text,fontWeight:500}}>{v!=null?fmt$(v):"—"}</span></div>)}</div>
          <div><div style={{fontSize:13,color:C.gold,fontWeight:600,marginBottom:10}}>Property Flags</div>{[["HOA",aiModal.aiEstimate?.hoa],["Lot Type",aiModal.aiEstimate?.lot_type],["Zoning",aiModal.aiEstimate?.zoning],["Buildable",aiModal.aiEstimate?.buildable],["Flood Zone",aiModal.aiEstimate?.flood_zone],["Wetlands",aiModal.aiEstimate?.wetlands],["CIAC",aiModal.aiEstimate?.ciac]].map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}><span style={{color:C.textSec}}>{l}</span><span style={{color:flagColor(v),fontWeight:500}}>{v||"—"}</span></div>)}</div>
        </div>
        {aiModal.aiEstimate?.notes&&<p style={{marginTop:12,fontSize:12,color:C.textSec,fontStyle:"italic"}}>{aiModal.aiEstimate.notes}</p>}
      </Modal>}
      <HelpButton pageId="pipeline"/>
    </div>);
  };

  // ═══ TEMPLATES (SHARED, EDITABLE) ═══
  const TemplatesPage = () => {
    const [copied,setCopied]=useState(null);const [editing,setEditing]=useState(null);const [editText,setEditText]=useState("");
    const [fillKey,setFillKey]=useState(null);const [fillData,setFillData]=useState({name:"",address:"",phone:"",email:""});
    const [savedTemplates,setSavedTemplates]=useState({});
    useEffect(()=>{const unsub=subscribe(sPath("templates"),(data)=>{if(data)setSavedTemplates(data);});return unsub;},[]);
    const merged={...TEMPLATES};Object.entries(savedTemplates).forEach(([k,v])=>{if(merged[k])merged[k]={...merged[k],content:v};});
    const copy=k=>{navigator.clipboard.writeText(merged[k].content).catch(()=>{});setCopied(k);setTimeout(()=>setCopied(null),2000);};
    const startEdit=k=>{setEditing(k);setEditText(merged[k].content);};
    const saveEdit=()=>{const updated={...savedTemplates,[editing]:editText};setSavedTemplates(updated);saveData(sPath("templates"),updated);setEditing(null);addToast("Template saved");};
    const copyFilled=()=>{const filled=fillTemplate(merged[fillKey].content,fillData);navigator.clipboard.writeText(filled).catch(()=>{});addToast("Filled template copied");setFillKey(null);setFillData({name:"",address:"",phone:"",email:""});};
    return(<div><TopBar title="Outreach Templates"/>{Object.entries(merged).map(([k,t])=>(<Card key={k} style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:15,color:C.goldLight,fontWeight:500,fontFamily:FH}}>{t.title}</div>
        <div style={{display:"flex",gap:8}}>
          {editing===k?<><button style={btnStyle} onClick={saveEdit}>Save</button><button style={btnOutline} onClick={()=>setEditing(null)}>Cancel</button></>:<><button style={btnOutline} onClick={()=>startEdit(k)}>Edit</button><button style={btnOutline} onClick={()=>{setFillKey(k);setFillData({name:"",address:"",phone:"",email:""});}}>Fill & Copy</button><button style={btnStyle} onClick={()=>copy(k)}>{copied===k?"✓ Copied":"Copy"}</button></>}
        </div>
      </div>
      {editing===k?<textarea style={{...textareaStyle,minHeight:200,fontSize:13,lineHeight:1.7}} value={editText} onChange={e=>setEditText(e.target.value)}/>:<pre style={{whiteSpace:"pre-wrap",fontSize:13,color:C.textSec,lineHeight:1.7,margin:0,fontFamily:"inherit"}}>{t.content}</pre>}
    </Card>))}
    {fillKey&&<Modal title={`Fill & Copy: ${merged[fillKey]?.title}`} onClose={()=>setFillKey(null)}>
      <div style={formRow}><FormField label="Name"><input style={inputStyle} value={fillData.name} onChange={e=>setFillData(p=>({...p,name:e.target.value}))}/></FormField><FormField label="Phone"><input style={inputStyle} value={fillData.phone} onChange={e=>setFillData(p=>({...p,phone:e.target.value}))}/></FormField></div>
      <FormField label="Address" full><input style={inputStyle} value={fillData.address} onChange={e=>setFillData(p=>({...p,address:e.target.value}))}/></FormField>
      <FormField label="Email" full><input style={inputStyle} value={fillData.email} onChange={e=>setFillData(p=>({...p,email:e.target.value}))}/></FormField>
      <div style={{background:C.bgInput,border:`1px solid ${C.goldBorder}`,borderRadius:12,padding:14,marginTop:12,maxHeight:250,overflowY:"auto"}}><pre style={{whiteSpace:"pre-wrap",fontSize:12,color:C.textSec,lineHeight:1.6,margin:0,fontFamily:"inherit"}}>{fillTemplate(merged[fillKey]?.content||"",fillData)}</pre></div>
      <button style={{...btnStyle,marginTop:14,width:"100%"}} onClick={copyFilled}>Copy Filled Template</button>
    </Modal>}
    <HelpButton pageId="templates"/></div>);
  };

  // ═══ CALENDAR — MONTH GRID ═══
  const CalendarPage = () => {
    const [viewDate,setViewDate]=useState(new Date());const [selSeller,setSelSeller]=useState(null);
    const t=todayStr();const allFU=sellers.filter(l=>l.followUp&&!l.archived);
    const overdue=allFU.filter(l=>l.followUp<t);const todayFU=allFU.filter(l=>l.followUp===t);
    const thisWeek=allFU.filter(l=>{const d=new Date(l.followUp);const now=new Date();return l.followUp>t&&d<=new Date(now.getTime()+7*864e5);});
    const markCalled=id=>{setSellers(p=>p.map(l=>l.id===id?{...l,status:"Called",lastContact:t,updatedAt:new Date().toISOString()}:l));addToast("Marked as called");setSelSeller(null);};
    const yr=viewDate.getFullYear(),mo=viewDate.getMonth();const fd=new Date(yr,mo,1).getDay();const dim=new Date(yr,mo+1,0).getDate();
    const cells=[];for(let i=0;i<fd;i++)cells.push(null);for(let d=1;d<=dim;d++){const ds=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;cells.push({day:d,date:ds,fups:allFU.filter(l=>l.followUp===ds),isToday:ds===t,isPast:ds<t});}
    while(cells.length%7)cells.push(null);
    return(<div><TopBar title="Calendar / Tasks"/>
      <div className="stats-row" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        <Card style={{padding:16,textAlign:"center"}}><div style={{fontSize:26,fontWeight:400,color:C.red,fontFamily:FH}}>{overdue.length}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>Overdue</div></Card>
        <Card style={{padding:16,textAlign:"center"}}><div style={{fontSize:26,fontWeight:400,color:C.orange,fontFamily:FH}}>{todayFU.length}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>Due Today</div></Card>
        <Card style={{padding:16,textAlign:"center"}}><div style={{fontSize:26,fontWeight:400,color:C.blue,fontFamily:FH}}>{thisWeek.length}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>This Week</div></Card>
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${C.goldBorder}`}}>
          <div style={{display:"flex",gap:8}}><button onClick={()=>setViewDate(new Date(yr,mo-1,1))} style={{...btnOutline,padding:"5px 12px"}}>←</button><button onClick={()=>setViewDate(new Date())} style={{...btnOutline,padding:"5px 12px",fontSize:11}}>Today</button><button onClick={()=>setViewDate(new Date(yr,mo+1,1))} style={{...btnOutline,padding:"5px 12px"}}>→</button></div>
          <div style={{fontSize:18,color:C.text,fontWeight:400,fontFamily:FH,letterSpacing:1}}>{viewDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d=><div key={d} style={{padding:"8px",textAlign:"center",fontSize:10,color:C.textMuted,letterSpacing:1.5,fontWeight:600,borderBottom:`1px solid ${C.goldBorder}`}}>{d}</div>)}
          {cells.map((c,i)=><div key={i} style={{minHeight:80,padding:4,borderBottom:`1px solid ${C.goldBorder}`,borderRight:(i+1)%7?`1px solid ${C.goldBorder}`:"none",background:c?.isToday?"rgba(212,175,55,0.06)":c?.isPast&&c.fups?.length?"rgba(229,57,53,0.04)":"transparent"}}>
            {c&&<><div style={{fontSize:11,color:c.isToday?C.gold:C.textMuted,fontWeight:c.isToday?700:400,textAlign:"right",marginBottom:3}}>{c.day}</div>
            {c.fups.slice(0,3).map(f=><div key={f.id} onClick={()=>setSelSeller(f)} style={{fontSize:9,padding:"2px 5px",borderRadius:5,marginBottom:1,cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",background:(STATUS_COLORS[f.status]||C.textMuted)+"22",color:STATUS_COLORS[f.status]||C.text,borderLeft:c.isPast?`2px solid ${C.red}`:"none"}}>{f.name||"?"}</div>)}
            {c.fups.length>3&&<div style={{fontSize:8,color:C.textMuted,textAlign:"center"}}>+{c.fups.length-3}</div>}</>}
          </div>)}
        </div>
      </Card>
      {selSeller&&<Modal title="Follow-Up" onClose={()=>setSelSeller(null)}>
        <div style={{fontSize:16,color:C.text,fontWeight:500,marginBottom:4}}>{selSeller.name||"Unknown"}</div>
        <div style={{fontSize:13,color:C.textMuted,marginBottom:12}}>{selSeller.address}</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}><Badge color={STATUS_COLORS[selSeller.status]}>{selSeller.status}</Badge><span style={{fontSize:12,color:C.textSec}}>{fmtDateFull(selSeller.followUp)}</span></div>
        {selSeller.phone&&<div style={{marginBottom:12}}><a href={`tel:${selSeller.phone}`} style={{color:C.gold,textDecoration:"none"}}>{selSeller.phone}</a></div>}
        <div style={{display:"flex",gap:10}}><button style={btnStyle} onClick={()=>markCalled(selSeller.id)}>Mark Called</button><button style={btnOutline} onClick={()=>{setPrefillCallId(selSeller.id);setPage("calls");setSelSeller(null);}}>Log Call</button></div>
      </Modal>}
      <HelpButton pageId="calendar"/></div>);
  };

  // ═══ FEEDBACK (PERSONAL) ═══
  const FeedbackPage = () => {
    const [modal,setModal]=useState(false);const [form,setForm]=useState({dealId:"",outcome:"Won",lessons:"",scriptUsed:"",effectiveness:"",postMortem:""});const saveF=()=>{setFeedback(p=>[{...form,id:uid(),date:todayStr()},...p]);setModal(false);};
    return(<div><TopBar title="Personal Notes"/><div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button style={btnStyle} onClick={()=>{setForm({dealId:"",outcome:"Won",lessons:"",scriptUsed:"",effectiveness:"",postMortem:""});setModal(true);}}>+ Add Entry</button></div>{feedback.length===0?<EmptyState icon="✎" msg="No feedback entries yet."/>:feedback.map(f=>{const deal=deals.find(d=>d.id===f.dealId);return(<Card key={f.id} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:C.goldLight}}>{deal?deal.address:"General"}</span><span style={{color:C.textMuted,fontSize:12}}>{fmtDateFull(f.date)}</span></div><Badge color={f.outcome==="Won"?C.green:C.red}>{f.outcome}</Badge>{f.lessons&&<p style={{color:C.textSec,fontSize:13,marginTop:8}}>Lessons: {f.lessons}</p>}{f.scriptUsed&&<p style={{color:C.textSec,fontSize:13}}>Script: {f.scriptUsed} — Effectiveness: {f.effectiveness||"N/A"}</p>}{f.postMortem&&<p style={{color:C.textSec,fontSize:13}}>Post-Mortem: {f.postMortem}</p>}</Card>);})}{modal&&<Modal title="Add Feedback" onClose={()=>setModal(false)}><FormField label="Linked Deal" full><select style={selectStyle} value={form.dealId} onChange={e=>setForm(p=>({...p,dealId:e.target.value}))}><option value="">— General —</option>{deals.map(d=><option key={d.id} value={d.id}>{d.address}</option>)}</select></FormField><FormField label="Outcome" full><select style={selectStyle} value={form.outcome} onChange={e=>setForm(p=>({...p,outcome:e.target.value}))}><option>Won</option><option>Lost</option><option>Stalled</option></select></FormField><FormField label="Lessons Learned" full><textarea style={textareaStyle} value={form.lessons} onChange={e=>setForm(p=>({...p,lessons:e.target.value}))}/></FormField><div style={formRow}><FormField label="Script Used"><input style={inputStyle} value={form.scriptUsed} onChange={e=>setForm(p=>({...p,scriptUsed:e.target.value}))}/></FormField><FormField label="Effectiveness (1-10)"><input style={inputStyle} value={form.effectiveness} onChange={e=>setForm(p=>({...p,effectiveness:e.target.value}))}/></FormField></div><FormField label="Post-Mortem" full><textarea style={textareaStyle} value={form.postMortem} onChange={e=>setForm(p=>({...p,postMortem:e.target.value}))}/></FormField><button style={btnStyle} onClick={saveF}>Save</button></Modal>}<HelpButton pageId="notes"/></div>);
  };

  // ═══ MERGED: DATA & IMPORT ═══
  const DataImportPage = () => {
    const [importText,setImportText]=useState("");const [result,setResult]=useState("");const [confirm,setConfirm]=useState(false);
    const bulkImport=()=>{const lines=importText.trim().split("\n").filter(Boolean);const nl=lines.map(line=>{const p=line.split(/[,\t]+/).map(s=>s.trim());return{id:uid(),name:p[0]||"",address:p[1]||"",phone:p[2]||"",email:p[3]||"",status:"Not Called",lastContact:"",followUp:"",notes:"",buyerId:"",archived:false,updatedAt:new Date().toISOString()};});setSellers(p=>[...p,...nl]);setResult(`Imported ${nl.length} sellers.`);setImportText("");addToast(`Imported ${nl.length} sellers`);};
    const bulkFU=()=>{const d=new Date();d.setDate(d.getDate()+3);const fd=d.toISOString().split("T")[0];let c=0;setSellers(p=>p.map(l=>{if(!l.archived&&["Called","Voicemail","Interested"].includes(l.status)&&!l.followUp){c++;return{...l,followUp:fd};}return l;}));setResult(`Scheduled ${c} follow-ups for ${fmtDate(fd)}.`);addToast(`Scheduled ${c} follow-ups`);};
    const exportCSV=(data,fn,headers)=>{const csv=[headers.join(","),...data.map(r=>headers.map(h=>JSON.stringify(r[h]||"")).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=fn;a.click();};
    const clearAll=()=>{setBuyers([]);setSellers([]);setCalls([]);setDeals([]);setFeedback([]);setConfirm(false);addToast("All data cleared");};
    return(<div><TopBar title="Data & Import"/>
      <Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Bulk Import</div><p style={{fontSize:13,color:C.textSec,marginBottom:12}}>Name, Address, Phone, Email (one per line)</p><textarea style={{...textareaStyle,minHeight:120}} value={importText} onChange={e=>setImportText(e.target.value)}/><div style={{display:"flex",gap:10,marginTop:12}}><button style={btnStyle} onClick={bulkImport}>Import All</button><button style={btnOutline} onClick={bulkFU}>Schedule Follow-Ups (3 days)</button></div>{result&&<p style={{color:C.green,margin:"12px 0 0",fontSize:13}}>{result}</p>}</Card>
      <Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Export Data</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button style={btnStyle} onClick={()=>exportCSV(buyers,"buyers.csv",["name","phone","email","minAcres","maxAcres","maxPrice","locations","notes"])}>Buyers</button><button style={btnStyle} onClick={()=>exportCSV(sellers,"sellers.csv",["name","address","phone","email","status","lastContact","followUp","notes"])}>Sellers</button><button style={btnStyle} onClick={()=>exportCSV(calls,"calls.csv",["date","time","leadId","result","discussed","notes","followUp"])}>Calls</button><button style={btnStyle} onClick={()=>exportCSV(deals,"deals.csv",["address","acres","fmv","offerPrice","buyerPrice","profit","status","dateEntered","targetClose","notes"])}>Pipeline</button></div></Card>
      <Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Storage ({profile})</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>{[["Buyers",buyers],["Sellers",sellers],["Calls",calls],["Deals",deals],["Notes",feedback]].map(([n,d])=>(<div key={n}><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase"}}>{n}</div><div style={{fontSize:20,color:C.text,fontWeight:300,marginTop:2}}>{d.length}</div></div>))}</div></Card>
      <Card style={{borderColor:"rgba(229,57,53,0.25)"}}><div style={{fontSize:16,color:C.red,fontWeight:500,fontFamily:FH,marginBottom:14}}>Danger Zone</div>{!confirm?<button style={btnDanger} onClick={()=>setConfirm(true)}>Clear All Data</button>:(<div><p style={{color:C.red,fontSize:13,marginBottom:12}}>Permanently delete ALL data for {profile}?</p><div style={{display:"flex",gap:10}}><button style={{...btnDanger,padding:"10px 24px"}} onClick={clearAll}>Yes, Delete Everything</button><button style={btnOutline} onClick={()=>setConfirm(false)}>Cancel</button></div></div>)}</Card>
      <HelpButton pageId="dataImport"/>
    </div>);
  };

  // ═══ MERGED: ANALYTICS (Enhanced SVG Charts) ═══
  const AnalyticsPage = () => {
    const [tab,setTab]=useState("performance");
    const conv=calls.length?((closedDeals.length/calls.length)*100).toFixed(1):"0";const avg=closedDeals.length?totalProfit/closedDeals.length:0;const cpa=closedDeals.length&&calls.length?(calls.length/closedDeals.length).toFixed(1):"—";
    const pbb={};closedDeals.forEach(d=>{const b=buyers.find(x=>x.id===d.buyerId);const n=b?b.name:"Unlinked";pbb[n]=(pbb[n]||0)+Number(d.profit||0);});
    const sc={};DEAL_STATUSES.forEach(s=>sc[s]=deals.filter(d=>d.status===s).length);const total=deals.length||1;const vconv=DEAL_STATUSES.map((s,i)=>({stage:s,count:sc[s],rate:i===0?"—":sc[DEAL_STATUSES[i-1]]?(sc[s]/sc[DEAL_STATUSES[i-1]]*100).toFixed(0)+"%":"—"}));
    const pillStyle=(active)=>({padding:"8px 20px",borderRadius:10,border:`1px solid ${active?C.gold:C.goldBorder}`,background:active?"rgba(212,175,55,0.1)":"transparent",color:active?C.gold:C.textSec,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:active?600:400});
    const outcomes={};calls.forEach(c=>{const r=c.result||"Unknown";outcomes[r]=(outcomes[r]||0)+1;});const outcomeEntries=Object.entries(outcomes).sort((a,b)=>b[1]-a[1]);const totalCalls=calls.length||1;
    const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];const dayCounts=[0,0,0,0,0,0,0];calls.forEach(c=>{if(c.date){const d=new Date(c.date+"T00:00:00").getDay();dayCounts[d]++;}});const maxDay=Math.max(...dayCounts)||1;
    const fuSellers=sellers.filter(s=>s.followUp);const fuConverted=fuSellers.filter(s=>["Interested","Negotiating","Under Contract"].includes(s.status));const fuRate=fuSellers.length?(fuConverted.length/fuSellers.length*100).toFixed(0):"0";
    const callsByDay={};for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split("T")[0];callsByDay[ds]={total:0,interested:0};}calls.forEach(c=>{if(callsByDay[c.date]){callsByDay[c.date].total++;if(c.result==="Interested")callsByDay[c.date].interested++;}});const cbd=Object.entries(callsByDay);const maxCbd=Math.max(...cbd.map(([,v])=>v.total))||1;

    return(<div><TopBar title="Analytics"/>
      <div style={{display:"flex",gap:8,marginBottom:22}}>{[{k:"performance",l:"Performance"},{k:"financial",l:"Financial"},{k:"velocity",l:"Velocity"}].map(t=><button key={t.k} style={pillStyle(tab===t.k)} onClick={()=>setTab(t.k)}>{t.l}</button>)}</div>

      {tab==="performance"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14,marginBottom:22}}>{[{v:calls.length,l:"Total Calls"},{v:conv+"%",l:"Conversion"},{v:fmt$(avg),l:"Avg Profit"},{v:fmt$(pipelineProfit),l:"Pipeline Profit"},{v:closedDeals.length,l:"Closed"},{v:fmt$(totalRevenue),l:"Revenue"},{v:fmt$(totalProfit),l:"Profit YTD"},{v:weekCalls.length,l:"This Week"}].map((s,i)=>(<Card key={i} style={{padding:18,textAlign:"center"}}><div style={{fontSize:26,fontWeight:400,color:C.goldLight,fontFamily:FH}}>{s.v}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>{s.l}</div></Card>))}</div>

        {/* Conversion Ring + Seller Status Breakdown - always visible */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Conversion Rate</div>
            <div style={{position:"relative",width:110,height:110,margin:"0 auto"}}>
              <svg viewBox="0 0 120 120" style={{width:"100%"}}><circle cx="60" cy="60" r="50" fill="none" stroke={C.goldBorder} strokeWidth="8"/><circle cx="60" cy="60" r="50" fill="none" stroke={C.gold} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${Number(conv)*3.14} 314`} transform="rotate(-90 60 60)" opacity="0.7"/></svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:28,fontWeight:400,color:C.goldLight,fontFamily:FH}}>{conv}%</div></div>
            </div>
            <div style={{textAlign:"center",marginTop:8,fontSize:10,color:C.textMuted,letterSpacing:1}}>CALLS → CLOSED</div>
          </Card>
          <Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Seller Status</div>
            {(()=>{const statCounts={};sellers.filter(s=>!s.archived).forEach(s=>{statCounts[s.status]=(statCounts[s.status]||0)+1;});const entries=Object.entries(statCounts).sort((a,b)=>b[1]-a[1]);const totalS=sellers.filter(s=>!s.archived).length||1;if(!entries.length)return<p style={{color:C.textMuted,fontSize:12}}>No sellers yet.</p>;
            return<div>{entries.map(([st,cnt])=><div key={st} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}><span style={{color:C.textSec}}>{st}</span><span style={{color:C.textMuted}}>{cnt} ({Math.round(cnt/totalS*100)}%)</span></div><div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.04)"}}><div style={{height:6,borderRadius:3,background:STATUS_COLORS[st]||C.textMuted,opacity:0.6,width:`${cnt/totalS*100}%`}}/></div></div>)}</div>;})()}
          </Card>
        </div>

        {calls.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Calls Over Time</div>
          <svg viewBox="0 0 500 130" style={{width:"100%"}}>{cbd.map(([d,v],i)=>{const x=20+i*(460/(cbd.length-1||1));const h=(v.total/maxCbd)*80;const hi=(v.interested/maxCbd)*80;return<g key={d}><rect x={x-8} y={100-h} width={16} height={h} rx={3} fill={C.gold} opacity={0.25}/><rect x={x-5} y={100-hi} width={10} height={hi} rx={2} fill={C.green} opacity={0.5}/>{i%3===0&&<text x={x} y={118} textAnchor="middle" fill={C.textMuted} fontSize="7">{d.slice(5)}</text>}</g>;})}<line x1="20" y1="100" x2="480" y2="100" stroke={C.goldBorder} strokeWidth="0.5"/></svg>
          <div style={{display:"flex",gap:16,marginTop:6}}><div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.textMuted}}><div style={{width:8,height:8,borderRadius:2,background:C.gold,opacity:0.4}}/>Total</div><div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.textMuted}}><div style={{width:8,height:8,borderRadius:2,background:C.green,opacity:0.6}}/>Interested</div></div>
        </Card>}
        {calls.length===0&&<Card style={{marginBottom:14,textAlign:"center",padding:30}}><div style={{fontSize:32,opacity:0.15,marginBottom:8}}>📊</div><p style={{color:C.textMuted,fontSize:13}}>Call charts will appear once you start logging calls.</p></Card>}
        {calls.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Call Outcomes</div>
          <svg viewBox="0 0 500 28" style={{width:"100%",borderRadius:6,overflow:"hidden"}}>{(()=>{let x=0;return outcomeEntries.map(([r,cnt])=>{const w=(cnt/totalCalls)*500;const el=<g key={r}><rect x={x} y={0} width={w} height={28} fill={STATUS_COLORS[r]||C.textMuted} opacity={0.7}/>{w>45&&<text x={x+w/2} y={18} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="500">{Math.round(cnt/totalCalls*100)}%</text>}</g>;x+=w;return el;});})()}</svg>
          <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:10}}>{outcomeEntries.map(([r,cnt])=><div key={r} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}><div style={{width:8,height:8,borderRadius:4,background:STATUS_COLORS[r]||C.textMuted,opacity:0.7}}/><span style={{color:C.textSec}}>{r}: {cnt}</span></div>)}</div>
        </Card>}
        {calls.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Best Days to Call</div>
          <svg viewBox="0 0 350 100" style={{width:"100%",maxWidth:400}}>{dayNames.map((d,i)=>{const h=(dayCounts[i]/maxDay)*65;const isMax=dayCounts[i]===maxDay&&dayCounts[i]>0;return<g key={d}><rect x={i*50+10} y={82-h} width={30} height={h} rx={4} fill={C.gold} opacity={isMax?0.8:0.35}/><text x={i*50+25} y={96} textAnchor="middle" fill={C.textMuted} fontSize="9">{d}</text>{dayCounts[i]>0&&<text x={i*50+25} y={77-h} textAnchor="middle" fill={C.textSec} fontSize="8">{dayCounts[i]}</text>}{isMax&&<text x={i*50+25} y={70-h} textAnchor="middle" fill={C.gold} fontSize="7" fontWeight="600">Best</text>}</g>;})}</svg>
        </Card>}
        <Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Follow-Up Conversion</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,textAlign:"center"}}><div><div style={{fontSize:28,color:C.blue,fontFamily:FH}}>{fuSellers.length}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1}}>SCHEDULED</div></div><div><div style={{fontSize:28,color:C.green,fontFamily:FH}}>{fuConverted.length}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1}}>CONVERTED</div></div><div><div style={{fontSize:28,color:C.goldLight,fontFamily:FH}}>{fuRate}%</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1}}>RATE</div></div></div>
        </Card>
        {Object.keys(pbb).length>0&&<Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Profit by Buyer</div>{Object.entries(pbb).sort((a,b)=>b[1]-a[1]).map(([n,p])=><div key={n} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${C.goldBorder}`}}><span>{n}</span><span style={{color:C.goldLight,fontWeight:600}}>{fmt$(p)}</span></div>)}</Card>}
      </div>}

      {tab==="financial"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:22}}>{[{v:fmt$(totalRevenue),l:"Total Revenue",c:C.green},{v:fmt$(totalProfit),l:"Profit YTD",c:C.goldLight},{v:fmt$(avg),l:"Avg Profit/Deal",c:C.blue},{v:cpa,l:"Calls per Deal",c:C.orange}].map((s,i)=>(<Card key={i} style={{padding:20,textAlign:"center"}}><div style={{fontSize:28,fontWeight:400,color:s.c,fontFamily:FH}}>{s.v}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>{s.l}</div></Card>))}</div>

        {/* Revenue vs Profit vs Pipeline - always visible */}
        <Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Revenue vs Profit vs Pipeline</div>
          {(()=>{const maxVal=Math.max(totalRevenue,totalProfit,pipelineProfit,1);const bars=[{l:"Revenue",v:totalRevenue,c:C.green},{l:"Profit (Closed)",v:totalProfit,c:C.goldLight},{l:"Pipeline (Unrealized)",v:pipelineProfit,c:C.orange}];return<div>{bars.map(b=><div key={b.l} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:C.textSec}}>{b.l}</span><span style={{color:b.c,fontWeight:600}}>{fmt$(b.v)}</span></div><div style={{height:10,borderRadius:5,background:"rgba(255,255,255,0.04)"}}><div style={{height:10,borderRadius:5,background:b.c,opacity:0.5,width:`${Math.max(b.v/maxVal*100,b.v>0?3:0)}%`,transition:"width 0.5s"}}/></div></div>)}</div>;})()}
        </Card>

        {/* Calls to Close Funnel - always visible */}
        <Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Path to Close</div>
          <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",textAlign:"center"}}>
            {[{v:calls.length,l:"Calls",c:C.blue},{v:calls.filter(c=>c.result==="Interested").length,l:"Interested",c:C.green},{v:deals.filter(d=>d.status==="Under Contract").length,l:"Contracted",c:C.purple},{v:closedDeals.length,l:"Closed",c:C.green}].map((s,i)=><div key={s.l} style={{display:"flex",alignItems:"center",gap:8}}>{i>0&&<span style={{color:C.textMuted,fontSize:16}}>→</span>}<div><div style={{fontSize:24,fontWeight:400,color:s.c,fontFamily:FH}}>{s.v}</div><div style={{fontSize:10,color:C.textSec,letterSpacing:0.5}}>{s.l}</div></div></div>)}
          </div>
        </Card>

        {closedDeals.length>1&&<Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Profit Margin per Deal</div>
          {(()=>{const sorted=[...closedDeals].filter(d=>d.dateEntered&&Number(d.buyerPrice)).sort((a,b)=>a.dateEntered.localeCompare(b.dateEntered));const pts=sorted.map((d,i)=>({x:i,y:Number(d.buyerPrice)?((Number(d.profit||0)/Number(d.buyerPrice))*100):0}));const avgM=pts.reduce((s,p)=>s+p.y,0)/(pts.length||1);const maxM=Math.max(...pts.map(p=>Math.abs(p.y)),Math.abs(avgM),10);const w=480,h=100,px=20,py=10;return<svg viewBox={`0 0 ${w} ${h+10}`} style={{width:"100%"}}><line x1={px} y1={h/2+py-(avgM/maxM)*(h/2-py)} x2={w-px} y2={h/2+py-(avgM/maxM)*(h/2-py)} stroke={C.gold} strokeWidth="0.8" strokeDasharray="4 3" opacity="0.5"/><text x={w-px+4} y={h/2+py-(avgM/maxM)*(h/2-py)+3} fill={C.gold} fontSize="8" opacity="0.6">Avg {avgM.toFixed(0)}%</text><polyline points={pts.map(p=>`${px+(p.x/(pts.length-1||1))*(w-2*px)},${h/2+py-(p.y/maxM)*(h/2-py)}`).join(" ")} fill="none" stroke={C.green} strokeWidth="1.5" opacity="0.7"/>{pts.map(p=><circle key={p.x} cx={px+(p.x/(pts.length-1||1))*(w-2*px)} cy={h/2+py-(p.y/maxM)*(h/2-py)} r="3" fill={C.gold} opacity="0.6"/>)}</svg>;})()}
        </Card>}
        {closedDeals.length>1&&<Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Cumulative Revenue</div>
          {(()=>{const sorted=[...closedDeals].filter(d=>d.dateEntered).sort((a,b)=>a.dateEntered.localeCompare(b.dateEntered));let cum=0;const pts=sorted.map((d,i)=>{cum+=Number(d.buyerPrice||0);return{x:i,y:cum};});const maxY=cum||1;const w=480,h=100,px=20,py=10;return<svg viewBox={`0 0 ${w} ${h+15}`} style={{width:"100%"}}><defs><linearGradient id="revG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity="0.15"/><stop offset="100%" stopColor={C.gold} stopOpacity="0"/></linearGradient></defs><path d={`M ${px} ${h-py} ${pts.map(p=>`L ${px+(p.x/(pts.length-1||1))*(w-2*px)} ${h-py-(p.y/maxY)*(h-2*py)}`).join(" ")} L ${w-px} ${h-py} Z`} fill="url(#revG)"/><polyline points={pts.map(p=>`${px+(p.x/(pts.length-1||1))*(w-2*px)},${h-py-(p.y/maxY)*(h-2*py)}`).join(" ")} fill="none" stroke={C.gold} strokeWidth="1.5" opacity="0.7"/>{pts.map(p=><circle key={p.x} cx={px+(p.x/(pts.length-1||1))*(w-2*px)} cy={h-py-(p.y/maxY)*(h-2*py)} r="2.5" fill={C.gold} opacity="0.5"/>)}<text x={w-px} y={h-py-(cum/maxY)*(h-2*py)-6} textAnchor="end" fill={C.goldLight} fontSize="9">{fmt$(cum)}</text></svg>;})()}
        </Card>}
        {closedDeals.length===0&&<Card style={{marginBottom:14,textAlign:"center",padding:30}}><div style={{fontSize:32,opacity:0.15,marginBottom:8}}>💰</div><p style={{color:C.textMuted,fontSize:13}}>Line charts will appear once you close deals.</p></Card>}
        {closedDeals.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Deal Profit Distribution</div>
          {(()=>{const buckets=[{l:"$0-25k",min:0,max:25000},{l:"$25-50k",min:25000,max:50000},{l:"$50-100k",min:50000,max:100000},{l:"$100-200k",min:100000,max:200000},{l:"$200k+",min:200000,max:Infinity}];const counts=buckets.map(b=>({...b,count:closedDeals.filter(d=>{const p=Number(d.profit||0);return p>=b.min&&p<b.max;}).length}));const maxC=Math.max(...counts.map(c=>c.count))||1;return<svg viewBox="0 0 400 100" style={{width:"100%",maxWidth:420}}>{counts.map((b,i)=>{const h=(b.count/maxC)*60;return<g key={i}><rect x={i*80+10} y={80-h} width={60} height={h} rx={4} fill={C.purple} opacity={0.4}/><text x={i*80+40} y={94} textAnchor="middle" fill={C.textMuted} fontSize="8">{b.l}</text>{b.count>0&&<text x={i*80+40} y={75-h} textAnchor="middle" fill={C.textSec} fontSize="9">{b.count}</text>}</g>;})}</svg>;})()}
        </Card>}
        {Object.keys(pbb).length>0&&<Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Profit by Buyer</div>{Object.entries(pbb).sort((a,b)=>b[1]-a[1]).map(([n,p])=><div key={n} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${C.goldBorder}`}}><span>{n}</span><span style={{color:C.goldLight,fontSize:18,fontWeight:600}}>{fmt$(p)}</span></div>)}</Card>}
      </div>}

      {tab==="velocity"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:14,marginBottom:22}}>{DEAL_STATUSES.map(s=><Card key={s} style={{padding:18,textAlign:"center"}}><div style={{fontSize:26,fontWeight:400,color:STATUS_COLORS[s],fontFamily:FH,opacity:0.8}}>{sc[s]}</div><div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>{s}</div></Card>)}</div>
        <Card style={{marginBottom:14,maxWidth:540}}><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Deal Conversion Funnel</div>
          <svg viewBox="0 0 340 150" style={{width:"100%"}}>{DEAL_STATUSES.map((s,i)=>{const w=280-i*40;const x=(340-w)/2;const y=i*29;const prevC=i>0?sc[DEAL_STATUSES[i-1]]:0;const convR=i===0?"":prevC?(sc[s]/prevC*100).toFixed(0)+"%":"0%";return<g key={s}><rect x={x} y={y} width={w} height={23} rx={4} fill={STATUS_COLORS[s]} opacity={0.35}/><text x={170} y={y+16} textAnchor="middle" fill={C.text} fontSize="10" fontWeight="500" opacity="0.8">{s}: {sc[s]}{convR&&` · ${convR}`}</text></g>;})}</svg>
        </Card>
        <Card style={{padding:0,overflow:"hidden",marginBottom:14}}><table style={tableStyle}><thead><tr><th style={{...thStyle,borderRadius:"16px 0 0 0"}}>Stage</th><th style={thStyle}>Deals</th><th style={thStyle}>Conversion</th><th style={{...thStyle,borderRadius:"0 16px 0 0"}}>Progress</th></tr></thead><tbody>{vconv.map(c=><tr key={c.stage}><td style={tdStyle}><Badge color={STATUS_COLORS[c.stage]}>{c.stage}</Badge></td><td style={tdStyle}>{c.count}</td><td style={tdStyle}>{c.rate}</td><td style={tdStyle}><div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.04)",width:"100%"}}><div style={{height:5,borderRadius:3,background:STATUS_COLORS[c.stage],opacity:0.6,width:(c.count/total*100)+"%"}}/></div></td></tr>)}</tbody></table></Card>
        {deals.filter(d=>d.status!=="Closed"&&d.dateEntered).length>0&&<Card><div style={{fontSize:16,color:C.text,fontWeight:500,fontFamily:FH,marginBottom:14}}>Active Deal Age</div>{deals.filter(d=>d.status!=="Closed"&&d.dateEntered).map(d=>{const days=Math.floor((Date.now()-new Date(d.dateEntered))/864e5);return<div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.goldBorder}`}}><span>{d.address}</span><span style={{color:days>30?C.red:days>14?C.orange:C.green}}>{days}d <Badge color={STATUS_COLORS[d.status]}>{d.status}</Badge></span></div>;})}</Card>}
      </div>}
      <HelpButton pageId="analytics"/>
    </div>);
  };


  // ═══ MAP PAGE ═══
  const MapPage = () => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersLayer = useRef(null);
    const tileRef = useRef(null);
    const initDone = useRef(false);
    const [showBuyers, setShowBuyers] = useState(true);
    const [showArchived, setShowArchived] = useState(false);
    const [satellite, setSatellite] = useState(false);
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
      mapInstance.current=L.map(mapRef.current,{zoomControl:true}).setView([33.68,-78.89],10);
      tileRef.current=L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:'© CartoDB',maxZoom:19}).addTo(mapInstance.current);
      markersLayer.current=L.layerGroup().addTo(mapInstance.current);
      return()=>{if(mapInstance.current){mapInstance.current.remove();mapInstance.current=null;initDone.current=false;}};
    },[leafletReady]);

    // Satellite toggle
    useEffect(()=>{
      if(!leafletReady||!mapInstance.current||!tileRef.current) return;
      const L=window.L;
      mapInstance.current.removeLayer(tileRef.current);
      tileRef.current=satellite
        ?L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:'© Esri',maxZoom:19}).addTo(mapInstance.current)
        :L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:'© CartoDB',maxZoom:19}).addTo(mapInstance.current);
    },[satellite,leafletReady]);

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
        const color=s.status==="Not Called"?"#C8C8C8":(STATUS_COLORS[s.status]||C.textMuted);
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
        {/* Satellite toggle - bottom left */}
        <div onClick={()=>setSatellite(!satellite)} style={{position:"absolute",bottom:16,left:16,zIndex:1000,background:C.bgCard,border:`1px solid ${C.goldBorder}`,borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:12,color:C.gold,boxShadow:"0 4px 12px rgba(0,0,0,0.4)"}}>{satellite?"🌑 Dark":"🛰 Satellite"}</div>
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

  if(page==="welcome"||!profile) return <WelcomePage onSelectProfile={switchProfile}/>;

  const pages = {dashboard:<DashboardPage/>,buyers:<BuyersPage/>,sellers:<SellersPage/>,calls:<CallsPage/>,calculator:<AnalyzerPage/>,pipeline:<PipelinePage/>,templates:<TemplatesPage/>,analytics:<AnalyticsPage/>,calendar:<CalendarPage/>,map:<MapPage/>,notes:<FeedbackPage/>,dataImport:<DataImportPage/>};

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,color:C.text,fontFamily:FB}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.12);border-radius:3px;}
        input:focus,select:focus,textarea:focus{border-color:${C.gold}!important;box-shadow:0 0 0 3px rgba(212,175,55,0.08)!important;}
        button:hover{opacity:0.88;}
        @keyframes spin{to{transform:rotate(360deg);}}
        tr:hover td{background:rgba(212,175,55,0.03);}
        @media(max-width:900px){.m-sidebar{display:none!important;}.m-burger{display:flex!important;}.m-main{padding:16px!important;padding-top:60px!important;}.qa-grid{grid-template-columns:repeat(2,1fr)!important;}.m-topbar{flex-direction:column!important;align-items:flex-start!important;gap:8px!important;}}
        @media(max-width:700px){.dash-two-col{grid-template-columns:1fr!important;}.stats-row{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>
      <button className="m-burger" onClick={()=>setMobileNav(!mobileNav)} style={{display:"none",position:"fixed",top:10,left:10,zIndex:3000,background:C.bgCard,border:`1px solid ${C.goldBorder}`,borderRadius:12,padding:"10px 14px",cursor:"pointer",color:C.gold,fontSize:18,alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.5)"}}>☰</button>
      {mobileNav&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:3500}} onClick={()=>setMobileNav(false)}/>}
      {mobileNav&&<Sidebar mobile/>}
      <div className="m-sidebar"><Sidebar/></div>
      {/* Global Search — rendered outside Sidebar to prevent remount */}
      {((!sidebarCollapsed&&!mobileNav)||mobileNav)&&<div style={{position:"fixed",top:profile?160:105,left:16,width:mobileNav?228:sW-32,zIndex:mobileNav?4500:15,pointerEvents:"auto",display:(!sidebarCollapsed||mobileNav)?"block":"none"}} className={mobileNav?"":"m-sidebar"}>
        <div style={{position:"relative"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" style={{position:"absolute",left:10,top:9,pointerEvents:"none"}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input value={globalSearch} onChange={e=>{setGlobalSearch(e.target.value);setShowSearchResults(e.target.value.length>=2);}} onFocus={()=>{if(globalSearch.length>=2)setShowSearchResults(true);}} onKeyDown={e=>{if(e.key==="Escape"){setShowSearchResults(false);e.target.blur();}}} onBlur={()=>setTimeout(()=>setShowSearchResults(false),200)} placeholder="Search..." style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${C.goldBorder}`,borderRadius:10,padding:"8px 12px 8px 32px",fontSize:12,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/></div>
        {showSearchResults&&globalSearch.length>=2&&(()=>{const q=globalSearch.toLowerCase();const sr=sellers.filter(s=>!s.archived&&((s.name||"").toLowerCase().includes(q)||(s.address||"").toLowerCase().includes(q)||(s.phone||"").includes(q))).slice(0,5);const dr=deals.filter(d=>(d.address||"").toLowerCase().includes(q)).slice(0,5);const br=buyers.filter(b=>(b.name||"").toLowerCase().includes(q)||(b.locations||"").toLowerCase().includes(q)).slice(0,5);const cr=calls.filter(c=>(c.discussed||"").toLowerCase().includes(q)||(c.notes||"").toLowerCase().includes(q)).slice(0,3);if(!sr.length&&!dr.length&&!br.length&&!cr.length)return<div style={{position:"absolute",left:0,right:0,top:38,zIndex:2000,background:C.bgCard,border:`1px solid ${C.goldBorder}`,borderRadius:14,padding:16,boxShadow:"0 16px 40px rgba(0,0,0,0.4)"}}><p style={{color:C.textMuted,fontSize:12,margin:0}}>No results</p></div>;
        return<div style={{position:"absolute",left:0,right:0,top:38,zIndex:2000,background:C.bgCard,border:`1px solid ${C.goldBorder}`,borderRadius:14,padding:12,maxHeight:400,overflowY:"auto",boxShadow:"0 16px 40px rgba(0,0,0,0.4)"}} onMouseDown={e=>e.preventDefault()}>
          {sr.length>0&&<><div style={{fontSize:10,color:C.textMuted,letterSpacing:1,padding:"4px 0"}}>SELLERS</div>{sr.map(s=><div key={s.id} onMouseDown={()=>{nav("sellers");setGlobalSearch("");setShowSearchResults(false);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 6px",cursor:"pointer",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}><span style={{color:C.text}}>{s.name||s.address}</span><Badge color={STATUS_COLORS[s.status]}>{s.status}</Badge></div>)}</>}
          {dr.length>0&&<><div style={{fontSize:10,color:C.textMuted,letterSpacing:1,padding:"8px 0 4px"}}>DEALS</div>{dr.map(d=><div key={d.id} onMouseDown={()=>{nav("pipeline");setGlobalSearch("");setShowSearchResults(false);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 6px",cursor:"pointer",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12}}><span style={{color:C.text}}>{d.address||"—"}</span><Badge color={STATUS_COLORS[d.status]}>{d.status}</Badge></div>)}</>}
          {br.length>0&&<><div style={{fontSize:10,color:C.textMuted,letterSpacing:1,padding:"8px 0 4px"}}>BUYERS</div>{br.map(b=><div key={b.id} onMouseDown={()=>{nav("buyers");setGlobalSearch("");setShowSearchResults(false);}} style={{padding:"8px 6px",cursor:"pointer",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12,color:C.text}}>{b.name}</div>)}</>}
          {cr.length>0&&<><div style={{fontSize:10,color:C.textMuted,letterSpacing:1,padding:"8px 0 4px"}}>CALLS</div>{cr.map(c=><div key={c.id} onMouseDown={()=>{nav("calls");setGlobalSearch("");setShowSearchResults(false);}} style={{padding:"8px 6px",cursor:"pointer",borderBottom:`1px solid ${C.goldBorder}`,fontSize:12,color:C.textSec}}>{(c.discussed||c.notes||"—").slice(0,60)}</div>)}</>}
        </div>;})()}
      </div>}
      <main className="m-main" style={{flex:1,padding:"28px 36px",overflowY:"auto",minWidth:0,background:C.bg}}>
        {pages[page]||<DashboardPage/>}
      </main>
      {toasts.length>0&&<div style={{position:"fixed",bottom:24,left:24,zIndex:3000,display:"flex",flexDirection:"column",gap:8}}>{toasts.map(t=><div key={t.id} style={{background:C.bgCard,border:`1px solid ${C.goldBorder}`,borderRadius:12,padding:"12px 20px",fontSize:13,color:t.type==="error"?C.red:C.gold,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",animation:"fadeIn 0.3s"}}>{t.message}</div>)}</div>}
    </div>
  );
}
