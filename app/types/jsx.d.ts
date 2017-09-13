// import * as Electron from 'electron';

declare namespace JSX {
  interface IntrinsicElements {
    // webview: React.DetailedHTMLProps<
    //   WebviewHTMLAttributes<Electron.WebviewTag>,
    //   Electron.WebviewTag
    // >;
    webview: any;
  }

  // See Electron type definitions
  interface WebviewHTMLAttributes<T> extends React.HTMLAttributes<T> {
    allowpopups?: string;
    autosize?: string;
    blinkfeatures?: string;
    disableblinkfeatures?: string;
    disableguestresize?: string;
    disablewebsecurity?: string;
    guestinstance?: string;
    httpreferrer?: string;
    nodeintegration?: string;
    partition?: string;
    plugins?: string;
    preload?: string;
    src?: string;
    useragent?: string;
    webpreferences?: string;
  }
}
