/* ============================================================
   This file is now a no-op shim. All numeric data has moved to
   /assets/data/csv/*.csv and is loaded by /assets/data/csv-loader.js
   (which is referenced first in every HTML <head>).

   Kept on disk so existing <script src="..."> tags in old HTML or
   external links do not 404. Safe to delete once HTML is updated.
   ============================================================ */
window.PETCOST_DATA = window.PETCOST_DATA || {};
