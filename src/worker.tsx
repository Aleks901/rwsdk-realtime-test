import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { syncedStateRoutes, SyncedStateServer } from "rwsdk/use-synced-state/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

type SyncedStateEnv = Cloudflare.Env & {
  SYNCED_STATE: DurableObjectNamespace<SyncedStateServer>;
};

export { SyncedStateServer as SyncedState };

export default defineApp([
  setCommonHeaders(),
  ...syncedStateRoutes((env) => (env as SyncedStateEnv).SYNCED_STATE),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [route("/", Home)]),
]);
