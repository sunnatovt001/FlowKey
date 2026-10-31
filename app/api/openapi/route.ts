import {openapi} from "@/server/openapi";
import {checkoutUrl} from "@/server/checkout";
export async function GET(){return Response.json(openapi(checkoutUrl('/').replace(/\/$/,'')));}
