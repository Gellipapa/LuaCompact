import fs from "fs";
import path from "path"
import util from "../util";

const defaultJSON = {
	main: "index.lua",
	rootDir: "src"
}

export default {
	name: "init",
	description: "Initializes a new luapacker project",
	async run(): Promise<void> {
		const directory = process.cwd();
		const configDir = path.join(directory, "/luapacker.json");

		if (!fs.existsSync(configDir)) {
			const entryDirInput = await util.prompt("Please enter the entry file: ");
			const rootDirInput = await util.prompt("Please enter the module directory: ");

			// If the user provides both an entry file and a root directory, we'll use those.
			// If not, it's safe to assume they want to use the default values.
			if (entryDirInput) {
				let entryDir = entryDirInput;
				if (!entryDirInput.endsWith(".lua") && !entryDirInput.endsWith(".luau")) entryDir += ".lua";
				defaultJSON.main = entryDir;
			}
			if (rootDirInput) defaultJSON.rootDir = rootDirInput;
			fs.writeFileSync(configDir, JSON.stringify(defaultJSON, null, 4)); // Create the config file in the user's working directory.

			// Create the entry point file and root directory if they don't already exists.
			const entryDir = path.join(directory, `/${defaultJSON.main}`);
			const rootDir = path.join(directory, `/${defaultJSON.rootDir}`);
			if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir);
			if (!fs.existsSync(entryDir)) {
				fs.writeFileSync(entryDir, "print(\"Hello World!\")");
				util.log(`No entry point found. Created ${defaultJSON.main}.`);
			}
			util.success("Initialized project!");
		} else {
			util.error("A luapacker project already exists here.");
		}
		process.exit();
	}
}