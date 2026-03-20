# Decorators in TypeScript and NestJS

## What is it / What problem does it solve

A decorator is a **function** that adds behavior or metadata to a class, method, property, or parameter without modifying the original code. Syntax — `@` symbol before a declaration.

**Why they exist:**
- Remove repetitive boilerplate code (auth, validation, logging)
- Make code declarative — you *describe* what should happen, not *how*
- Allow frameworks (NestJS) to auto-configure applications based on metadata

```ts
// Without decorators — imperative:
app.get('/movies', authMiddleware, cacheMiddleware, handler);

// With decorators — declarative:
@UseGuards(AuthGuard)
@CacheKey('movies')
@Get('movies')
findAll() {}
```

---

## How it works (under the hood)

### Two decorator standards

TypeScript has **two** variants of decorators:

| | Legacy (experimental) | TC39 Stage 3 |
|---|---|---|
| Flag | `experimentalDecorators: true` | No flag needed (TS 5.0+) |
| Metadata | `reflect-metadata` + `emitDecoratorMetadata` | `Symbol.metadata` (separate proposal) |
| NestJS | **Uses this one** | Not yet supported |

> **Important:** NestJS (as of 2025–2026) uses **legacy** decorators. That's why `tsconfig.json` always has `"experimentalDecorators": true`.

### What happens at compile time

When TypeScript encounters a decorator, it compiles it into a `__decorate` helper function call:

```ts
// Original TypeScript
@Injectable()
class MoviesService {}

// Compiled JavaScript (simplified)
MoviesService = __decorate([
  Injectable()
], MoviesService);
```

### Reflect Metadata — the key mechanism

NestJS stores all configuration in metadata via the `reflect-metadata` library. This works as a hidden key-value store attached to classes and methods.

```
┌─────────────────────────────────────────────┐
│  @Controller('movies')                      │
│       │                                     │
│       ▼                                     │
│  Reflect.defineMetadata('path', 'movies',   │
│                          MoviesController)   │
│                                             │
│  At NestJS startup:                         │
│  Reflect.getMetadata('path',                │
│                       MoviesController)      │
│  → 'movies'                                 │
└─────────────────────────────────────────────┘
```

Three automatic metadata keys (when `emitDecoratorMetadata: true`):

| Key | Contains |
|---|---|
| `design:type` | Property/method type |
| `design:paramtypes` | Method parameter types |
| `design:returntype` | Return value type |

This is exactly how **Dependency Injection** works in NestJS — the framework knows which dependencies to inject into the constructor thanks to `design:paramtypes`.

```ts
@Injectable()
class MoviesController {
  // NestJS reads design:paramtypes → [MoviesService]
  // and automatically creates and injects the MoviesService instance
  constructor(private moviesService: MoviesService) {}
}
```

---

## Basic usage

### 5 types of decorators in TypeScript

```ts
// 1. Class decorator
// Receives: constructor function
@Controller('movies')
class MoviesController {}

// 2. Method decorator
// Receives: target (prototype), propertyKey (method name), descriptor
class MoviesController {
  @Get(':id')
  findOne() {}
}

// 3. Property decorator
// Receives: target (prototype), propertyKey (property name)
class Movie {
  @Column()
  title: string;
}

// 4. Parameter decorator
// Receives: target (prototype), propertyKey (method name), parameterIndex
class MoviesController {
  findOne(@Param('id') id: string) {}
}

// 5. Accessor decorator (TS 5.0+ / TC39)
class Movie {
  @MaxLength(255)
  accessor title: string;
}
```

### Writing a simple decorator

```ts
// Class decorator — receives the constructor
function Sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@Sealed
class Movie {}

// Decorator factory — a function that returns a decorator
// Needed when passing arguments to the decorator: @Something(args)
function Log(prefix: string) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      console.log(`[${prefix}] ${key} called with`, args);
      return original.apply(this, args);
    };
  };
}

class MoviesService {
  @Log('movies')
  findAll() { /* ... */ }
}
```

### Execution order

Decorators are applied **bottom to top**, **right to left**:

```ts
@A
@B
class Foo {
  @C
  @D
  method(@E param: string) {}
}

// Order: E → D → C → B → A
// (parameters → methods → class, bottom to top)
```

---

## Practical examples (NestJS / Hedgeflix)

### Core NestJS decorators

```ts
// ===== Application structure =====

@Module({
  imports: [PrismaModule],        // module dependencies
  controllers: [MoviesController], // controllers
  providers: [MoviesService],      // services (DI providers)
  exports: [MoviesService],        // what's available to other modules
})
export class MoviesModule {}

@Controller('movies') // base path: /movies
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  // ===== HTTP methods =====

  @Get()                    // GET /movies
  findAll(@Query() query: FindMoviesDto) {
    return this.moviesService.findAll(query);
  }

  @Get(':id')               // GET /movies/123
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
  }

  @Post()                   // POST /movies
  @HttpCode(201)            // response code (default is 200 for POST)
  create(@Body() dto: CreateMovieDto) {
    return this.moviesService.create(dto);
  }

  @Patch(':id')             // PATCH /movies/123
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovieDto,
  ) {
    return this.moviesService.update(id, dto);
  }

  @Delete(':id')            // DELETE /movies/123
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.remove(id);
  }
}

@Injectable() // marks class as a DI provider
export class MoviesService {
  constructor(private prisma: PrismaService) {}
}
```

### Extracting data from requests

```ts
@Get('search')
search(
  @Query('q') query: string,           // ?q=inception → 'inception'
  @Query('page', ParseIntPipe) page: number, // ?page=2 → 2

  @Headers('accept-language') lang: string, // header
  @Ip() ip: string,                         // client IP
  @Req() req: Request,                      // full request object (avoid)
) {}
```

### Custom parameter decorator — `@CurrentUser()`

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a key is passed — return that specific field
    // @CurrentUser('email') → user.email
    return data ? user?.[data] : user;
  },
);

// Usage:
@Get('profile')
@UseGuards(AuthGuard)
getProfile(@CurrentUser() user: User) {
  return user;
}

@Get('my-email')
@UseGuards(AuthGuard)
getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

### Custom decorator with metadata — `@Roles()`

```ts
import { SetMetadata } from '@nestjs/common';

// Step 1: Decorator that saves metadata
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Step 2: Guard that reads this metadata
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Reflector reads metadata set by @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Step 3: Usage
@Post()
@Roles('admin')
@UseGuards(AuthGuard, RolesGuard)
create(@Body() dto: CreateMovieDto) {}
```

### Decorator composition — `applyDecorators()`

```ts
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

// Combine multiple decorators into one
export function Auth(...roles: string[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

// Instead of 4 decorators — just one:
@Post()
@Auth('admin')
create(@Body() dto: CreateMovieDto) {}
```

---

## Advanced patterns / Pro tips

### 1. Decorator + Interceptor = caching

```ts
// Decorator sets the cache key
export const CacheKey = (key: string) => SetMetadata('cacheKey', key);
export const CacheTTL = (ttl: number) => SetMetadata('cacheTTL', ttl);

// Interceptor reads it and caches the result
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private cache: CacheService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const key = this.reflector.get<string>('cacheKey', context.getHandler());
    if (!key) return next.handle();

    const cached = await this.cache.get(key);
    if (cached) return of(cached);

    return next.handle().pipe(
      tap((data) => {
        const ttl = this.reflector.get<number>('cacheTTL', context.getHandler()) ?? 60;
        this.cache.set(key, data, ttl);
      }),
    );
  }
}

// Usage
@Get()
@CacheKey('all-movies')
@CacheTTL(300)
@UseInterceptors(CacheInterceptor)
findAll() {}
```

### 2. Execution time measurement decorator

```ts
export function Measure(): MethodDecorator {
  return (target, key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      const result = await original.apply(this, args);
      const duration = (performance.now() - start).toFixed(2);
      console.log(`${String(key)} executed in ${duration}ms`);
      return result;
    };
  };
}

// Usage
@Injectable()
export class MoviesService {
  @Measure()
  async findAll() { /* ... */ }
}
```

### 3. Reflector — reading metadata at multiple levels

```ts
// getAllAndOverride — takes the first found value (method > class)
const roles = this.reflector.getAllAndOverride(ROLES_KEY, [
  context.getHandler(), // checks method first
  context.getClass(),   // then class
]);

// getAllAndMerge — combines values from both levels
const roles = this.reflector.getAllAndMerge(ROLES_KEY, [
  context.getHandler(),
  context.getClass(),
]);
// Class: @Roles('user'), Method: @Roles('admin') → ['admin', 'user']
```

### 4. Swagger documentation in a single line

```ts
export function ApiPaginatedResponse(model: Type) {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' },
        },
      },
    }),
    ApiQuery({ name: 'page', required: false }),
    ApiQuery({ name: 'limit', required: false }),
  );
}

@Get()
@ApiPaginatedResponse(MovieDto)
findAll() {}
```

---

## Real NestJS decorator implementations (source code)

All NestJS decorators essentially do the same thing — call `Reflect.defineMetadata()`. The real work happens later, when NestJS scans classes at startup and reads those metadata entries.

### 1. `@SetMetadata()` — the simplest one

```ts
// Real implementation from @nestjs/common
// https://github.com/nestjs/nest/blob/master/packages/common/decorators/core/set-metadata.decorator.ts

export function SetMetadata(key: string, value: any) {
  // Factory: returns a decorator
  return (target: object | Function, propertyKey?: string | symbol) => {
    // If applied to a method — store on the method
    // If applied to a class — store on the class
    if (propertyKey) {
      Reflect.defineMetadata(key, value, target, propertyKey);
    } else {
      Reflect.defineMetadata(key, value, target);
    }
  };
}

// Usage:
@SetMetadata('roles', ['admin'])
create() {}

// Later in a Guard:
Reflect.getMetadata('roles', handler); // → ['admin']
```

Literally one line — write a value to the metadata store.

### 2. `@Injectable()` — the foundation of DI

```ts
// Real implementation from @nestjs/common
// https://github.com/nestjs/nest/blob/master/packages/common/decorators/core/injectable.decorator.ts

import { INJECTABLE_WATERMARK, SCOPE_OPTIONS_METADATA } from '../../constants';

export function Injectable(options?: { scope?: Scope }): ClassDecorator {
  return (target: Function) => {
    // Mark the class as "injectable" — just a flag
    Reflect.defineMetadata(INJECTABLE_WATERMARK, true, target);

    // Save scope (DEFAULT, REQUEST, TRANSIENT)
    Reflect.defineMetadata(SCOPE_OPTIONS_METADATA, options, target);
  };
}

// INJECTABLE_WATERMARK = '__injectable__'
// It's just a string key

// The DI magic happens NOT here, but thanks to emitDecoratorMetadata.
// TypeScript automatically adds:
//
//   Reflect.metadata('design:paramtypes', [PrismaService])
//
// NestJS then does:
//   const deps = Reflect.getMetadata('design:paramtypes', MoviesService);
//   // → [PrismaService]
//   // OK, need to create PrismaService and pass it to the constructor
```

### 3. `@Get()`, `@Post()`, etc. — routing

```ts
// Real implementation from @nestjs/common
// https://github.com/nestjs/nest/blob/master/packages/common/decorators/http/request-mapping.decorator.ts

import { RequestMethod } from '../../enums';
import { PATH_METADATA, METHOD_METADATA } from '../../constants';

// Universal factory for all HTTP methods
function RequestMapping(
  method: RequestMethod,
  path?: string | string[],
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    // Save the path: '/movies/:id'
    Reflect.defineMetadata(PATH_METADATA, path ?? '/', descriptor.value);

    // Save the HTTP method: GET, POST, PATCH...
    Reflect.defineMetadata(METHOD_METADATA, method, descriptor.value);
  };
}

// Each decorator is just a wrapper with the method pre-filled
export function Get(path?: string | string[]): MethodDecorator {
  return RequestMapping(RequestMethod.GET, path);
}

export function Post(path?: string | string[]): MethodDecorator {
  return RequestMapping(RequestMethod.POST, path);
}

export function Delete(path?: string | string[]): MethodDecorator {
  return RequestMapping(RequestMethod.DELETE, path);
}

// At startup NestJS scans all controllers and reads:
//   const path = Reflect.getMetadata(PATH_METADATA, method);
//   const httpMethod = Reflect.getMetadata(METHOD_METADATA, method);
//   // and registers the route in Express/Fastify
```

### 4. `@Body()`, `@Param()`, `@Query()` — request parameters

```ts
// Real implementation (simplified)
// https://github.com/nestjs/nest/blob/master/packages/common/decorators/http/route-params.decorator.ts

import { ROUTE_ARGS_METADATA } from '../../constants';
import { RouteParamtypes } from '../../enums';

function createRouteParamDecorator(paramtype: RouteParamtypes) {
  // property is an optional key: @Body('title') → property = 'title'
  return (property?: string): ParameterDecorator => {
    return (target, propertyKey, parameterIndex) => {
      // Read already existing params (there may be multiple @Param, @Body...)
      const existingParams =
        Reflect.getMetadata(ROUTE_ARGS_METADATA, target, propertyKey) || {};

      // Key = type:index, e.g. 'BODY:0', 'PARAM:1'
      const key = `${paramtype}:${parameterIndex}`;

      // Add parameter information
      Reflect.defineMetadata(
        ROUTE_ARGS_METADATA,
        {
          ...existingParams,
          [key]: {
            index: parameterIndex,  // position in method arguments
            data: property,          // 'id', 'title', undefined...
          },
        },
        target,
        propertyKey,
      );
    };
  };
}

// Each decorator is a factory call with the appropriate type
export const Body = createRouteParamDecorator(RouteParamtypes.BODY);
export const Param = createRouteParamDecorator(RouteParamtypes.PARAM);
export const Query = createRouteParamDecorator(RouteParamtypes.QUERY);
export const Headers = createRouteParamDecorator(RouteParamtypes.HEADERS);

// Example: what gets stored for findOne(@Param('id') id, @Body() dto)
// ROUTE_ARGS_METADATA → {
//   'PARAM:0': { index: 0, data: 'id' },
//   'BODY:1':  { index: 1, data: undefined }
// }
//
// At invocation time NestJS reads this and does:
//   args[0] = req.params['id']      — for PARAM:0
//   args[1] = req.body              — for BODY:1
//   method.apply(controller, args)
```

### 5. `@Controller()` — putting it all together

```ts
// Real implementation (simplified)
// https://github.com/nestjs/nest/blob/master/packages/common/decorators/core/controller.decorator.ts

import { CONTROLLER_WATERMARK, PATH_METADATA, SCOPE_OPTIONS_METADATA } from '../../constants';

export function Controller(prefixOrOptions?: string | ControllerOptions): ClassDecorator {
  const prefix = typeof prefixOrOptions === 'string'
    ? prefixOrOptions
    : prefixOrOptions?.path ?? '/';

  return (target: Function) => {
    // Flag: "this is a controller"
    Reflect.defineMetadata(CONTROLLER_WATERMARK, true, target);

    // Base path: 'movies'
    Reflect.defineMetadata(PATH_METADATA, prefix, target);

    // Scope (optional)
    Reflect.defineMetadata(SCOPE_OPTIONS_METADATA, prefixOrOptions, target);
  };
}
```

### How NestJS reads all of this at startup

```
Application startup
       │
       ▼
Scans all @Module() → finds controllers and providers
       │
       ▼
For each controller:
  ├─ Reads CONTROLLER_WATERMARK → yes, it's a controller
  ├─ Reads PATH_METADATA → 'movies'
  ├─ Reads design:paramtypes → [MoviesService] → injects dependencies
  │
  └─ For each method:
       ├─ Reads METHOD_METADATA → GET
       ├─ Reads PATH_METADATA → ':id'
       ├─ Reads ROUTE_ARGS_METADATA → { 'PARAM:0': { data: 'id' } }
       │
       └─ Registers in Express:
            app.get('/movies/:id', (req, res) => {
              const args = [req.params['id']];
              const result = controller.findOne(...args);
              res.json(result);
            })
```

---

## Common mistakes / Gotchas

### 1. Forgot `@Injectable()` — DI doesn't work

```ts
// ❌ WRONG — NestJS doesn't know about this class
class MoviesService {
  constructor(private prisma: PrismaService) {} // Error: can't resolve
}

// ✅ CORRECT
@Injectable()
class MoviesService {
  constructor(private prisma: PrismaService) {}
}
```

### 2. Decorator order matters for readability

```ts
// ❌ Guard checks roles BEFORE @Roles() sets metadata?
// No, decorator order doesn't affect Guards/Interceptors runtime order.
// But readability suffers. Convention:

// ✅ Metadata first, then behavior
@Roles('admin')
@UseGuards(AuthGuard, RolesGuard)
@Post()
create() {}
```

### 3. `@Res()` disables automatic serialization

```ts
// ❌ NestJS no longer manages the response — interceptors won't fire
@Get()
findAll(@Res() res: Response) {
  res.json(data); // manual response
}

// ✅ Use passthrough if you need access to res
@Get()
findAll(@Res({ passthrough: true }) res: Response) {
  res.header('X-Custom', 'value');
  return data; // NestJS still manages the response
}
```

### 4. Decorators don't work on arrow functions

```ts
class Controller {
  // ❌ Arrow functions have no prototype — decorator won't apply correctly
  @Get()
  findAll = async () => {};

  // ✅ Use a regular method
  @Get()
  async findAll() {}
}
```

### 5. Circular dependency in module composition

```ts
// ❌ ModuleA imports ModuleB, and vice versa
@Module({ imports: [ModuleB] })
class ModuleA {}

@Module({ imports: [ModuleA] })
class ModuleB {}

// ✅ Use forwardRef()
@Module({ imports: [forwardRef(() => ModuleB)] })
class ModuleA {}
```

### 6. Don't confuse legacy and TC39 decorators

```ts
// In tsconfig.json for NestJS you MUST have:
{
  "compilerOptions": {
    "experimentalDecorators": true,    // legacy decorators
    "emitDecoratorMetadata": true      // metadata generation for DI
  }
}
// Without these flags, NestJS DI won't work!
```

---

## Links & Resources

### Official documentation
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) — legacy decorators reference
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators) — creating custom decorators in NestJS
- [TC39 Decorators Proposal](https://github.com/tc39/proposal-decorators) — new standard (Stage 3)
- [TC39 Decorator Metadata Proposal](https://github.com/tc39/proposal-decorator-metadata) — metadata for TC39 decorators

### Articles and tutorials
- [Deep Dive into NestJS Decorators (DEV.to)](https://dev.to/tejastn10/deep-dive-into-nestjs-decorators-internals-usage-and-custom-implementations-4eha)
- [Mastering Custom Decorators and Metadata in NestJS](https://shiftasia.com/community/mastering-custom-decorators-and-metadata-in-nestjs/)
- [TypeScript Reflect Metadata — What it is and How to Use it](https://blog.bitsrc.io/typescripts-reflect-metadata-what-it-is-and-how-to-use-it-fb7b19cfc7e2)
- [JavaScript Decorators: Native Support, TypeScript, and Beyond](https://www.furkanbaytekin.dev/blogs/software/javascript-decorators-native-support-typescript-and-beyond)

### What to study next
- **Dependency Injection** — how NestJS uses decorator metadata for automatic dependency creation
- **Guards, Interceptors, Pipes** — NestJS layers that work through decorators
- **Validation (class-validator)** — decorators for DTO validation (`@IsString()`, `@IsInt()`, `@MinLength()`)
- **TypeORM / Prisma** — decorators for DB schema definition (in TypeORM)
