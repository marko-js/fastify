import type { FastifyPluginCallback, FastifyReply } from "fastify";
import plugin from "fastify-plugin";

type MarkoInput = Record<string, unknown> & {
  $global?: Record<string, unknown>;
};

type MarkoTemplate<I extends MarkoInput> = {
  stream(input: I): ReadableStream;
  [x: string]: unknown;
};

declare module "fastify" {
  interface FastifyInstance {
    locals: Record<string, unknown>;
  }

  interface FastifyReply {
    locals: Record<string, unknown>;
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
      reply.locals = {};
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

        return this.type("text/html; charset=utf-8").send(
          template.stream(input || { $global })
        );
      }
    );

  done();
}) as FastifyPluginCallback<never>);
