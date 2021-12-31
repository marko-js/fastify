import type { FastifyPluginCallback, FastifyReply } from "fastify";
import plugin from "fastify-plugin";

type Locals = Record<string, unknown> & {
  serializedGlobals: Record<string, boolean>;
};

type MarkoInput = Record<string, unknown> & {
  $global?: Record<string, unknown> & {
    serializedGlobals?: Record<string, boolean>;
  };
};

type MarkoTemplate<I extends MarkoInput> = {
  stream(input: I): ReadableStream;
  [x: string]: unknown;
};

declare module "fastify" {
  interface FastifyInstance {
    locals: Locals;
  }

  interface FastifyReply {
    locals: Locals;
    marko<I extends MarkoInput, T extends MarkoTemplate<I>>(
      template: T,
      input?: I
    ): ReturnType<FastifyReply["send"]>;
  }
}

export default plugin<never>(((fastify, _options, done) => {
  fastify
    .decorate("locals", {})
    .addHook("onRequest", (_request, reply, done) => {
      reply.locals = {
        serializedGlobals: {}
      };
      done();
    })
    .decorateReply(
      "marko",
      function (
        this: FastifyReply,
        template: MarkoTemplate<MarkoInput>,
        input: MarkoInput
      ) {
        const $global = { ...fastify.locals, ...this.locals };

        if (input) {
          if (input.$global) {
            Object.assign($global, input.$global);
          }

          input.$global = $global;
        }

        // Disable fastify-compression for this stream
        this.request.headers["x-no-compression"] = "true";
        return this.type("text/html; charset=utf-8").send(
          template.stream(input || { $global })
        );
      }
    );

  done();
}) as FastifyPluginCallback<never>);
