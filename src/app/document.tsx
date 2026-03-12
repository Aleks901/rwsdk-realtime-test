import globalStylesHref from "@/app/pages/global.css?url";
import retroStylesHref from "@/components/ui/8bit/styles/retro.css?url";

export const Document: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Tavern MMO</title>
      <link rel="stylesheet" href={globalStylesHref} />
      <link rel="stylesheet" href={retroStylesHref} />
      <link rel="modulepreload" href="/src/client.tsx" />
    </head>
    <body>
      {children}
      <script>import("/src/client.tsx")</script>
    </body>
  </html>
);
