import { NestFactory, Reflector } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { JwtService } from "@nestjs/jwt";

import { AppModule } from "./app.module";

import { AccessGuard } from '~guards/access.guard';


async function start() {
   const PORT = process.env.PORT || 3170;
   const app = await NestFactory.create(AppModule);

   app.setGlobalPrefix(process.env.URL_PREFIX || "");

   const config = new DocumentBuilder()
      .setTitle("Paritet API service")
      .setVersion("1.0.0")
      .addBearerAuth({
         name: "Authorization",
         type: "http",
         scheme: "bearer",
         bearerFormat: "JWT",
         in: "header",
         description:
            "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter your token in the text input below.\r\n\r\nExample: \" Bearer 123abc\"",
      }, "JWT-auth")
      .setDescription("API для нужд... Для всяких.")

      /** *************************************************************** **/

      .addTag('kpi', "Контроллер учёта значений KPI")
      .addTag('staff', "Контроллер учёта статистики персонала")
      .addTag('stat', "Статистика")
      .addTag('glpi', "GLPI")

      /** *************************************************************** **/

      .build();
   const document = SwaggerModule.createDocument(app, config);
   SwaggerModule.setup((process.env.URL_PREFIX || "") + "/swagger", app, document, {
      customSiteTitle: "Paritet API",
      // swaggerOptions: { defaultModelsExpandDepth: -1 },
   });

   const jwtService = app.get(JwtService);
   const reflector = app.get(Reflector);
   app.useGlobalGuards(
      new AccessGuard(jwtService, reflector),
   );

   // CORS
   const CORSAllowList = [
      "http://192.168.10.25",
      "http://192.168.10.25:80",
      "http://192.168.10.25:3301",
      "http://192.168.10.25:3311",
      "http://localhost:3000",
      "http://localhost:3301",
      "http://localhost:3311",
      "http://localhost:4242",
   ]
   const corsOptionsDelegate = function (req: string, callback: (arg0: null, arg1: any) => void) {
      let corsOptions: { origin: boolean; };
      if (CORSAllowList.indexOf(req) !== -1) {
         corsOptions = {origin: true} // reflect (enable) the requested origin in the CORS response
      } else {
         corsOptions = {origin: false} // disable CORS for this request
      }
      console.log('CORS: ', req, corsOptions.origin)
      callback(null, corsOptions) // callback expects two parameters: error and options
   }
   app.enableCors({
      credentials: true,
      origin: corsOptionsDelegate,
   });

   await app.listen(PORT, () => {
      console.log(`Server on ${PORT}`);
      // app.get(Kpi_Service).up()
   });
}

void start();


