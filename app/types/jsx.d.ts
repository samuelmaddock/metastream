declare namespace JSX {
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
