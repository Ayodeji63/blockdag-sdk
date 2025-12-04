import { Alchemy } from "alchemy-sdk";
import z from "zod";

export const AbstractSdkClientSchema = z.instanceof(Alchemy);
