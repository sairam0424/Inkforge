#!/usr/bin/env node
import "dotenv/config";
import { program } from "commander";
import { registerGenerateCommand } from "./commands/generate.js";
import { registerPublishCommand } from "./commands/publish.js";
import { registerListCommand } from "./commands/list.js";

program
  .name("inkforge")
  .description("AI-powered article generation — notes/topic/code → human-readable MDX")
  .version("0.1.0");

registerGenerateCommand(program);
registerPublishCommand(program);
registerListCommand(program);

program.parse();
