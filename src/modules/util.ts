import fs from "fs";
import path from "path";
import chalk from "chalk";
import { stdin, stdout } from "process";

export default {
	success(message: string) {
		console.log(chalk.green("[SUCCESS]: ") + message);
	},

	log(message: string) {
		console.log(chalk.blue("[INFO]: ") + message);
	},

	warn(message: string) {
		console.log(chalk.yellow("[WARNING]: ") + message);
	},

	error(message: string) {
		console.log(chalk.red("[ERROR]: ") + message);
	},

	stringToByteArray(String: string) {
		const result = new Uint8Array(String.length);
		for (let i = 0; i < String.length; i++){
			result[i] = String.charCodeAt(i);
		}

		return result;
	},

	async prompt(question: string): Promise<string> {
		return await new Promise((resolve, reject) => {
			stdin.resume();
			stdout.write(question);

			stdin.on("data", data => resolve(data.toString().trim()));
			stdin.on("error", err => reject(err));
		});
	},

	// If no extension is passed in the directory string, check the user's directory for files with that name to find the appropriate extension.
	addMissingExtension(directory: string, extensions: string[]): string {
		let hasExtension = false;
		for (const extension of extensions) {
			if (directory.endsWith(extension)) {
				hasExtension = true;
				break;
			}
		}
		
		if (!hasExtension) {
			for (const extension of extensions) {
				if (fs.existsSync(directory + extension)) {
					directory += extension;
					break;
				}
			}
		}

		return directory;
	},

	retrieveFiles(directory: string, extensions?: string[]) {
		const files: string[] = [];
		fs.readdirSync(directory).forEach(async (file) => {
			const isDirectory = fs.lstatSync(path.join(directory, file)).isDirectory();
			const extension = path.extname(file);
			if (!extensions && !isDirectory) files.push(path.resolve(path.join(directory, file)));
			if (extensions && extensions.includes(extension)) {
				files.push(path.resolve(path.join(directory, file)));
			}
	
			// Walk through subdirectories and add any files matching the wanted extensions to the list.
			if (isDirectory) {
				const filesInDir = this.retrieveFiles(path.join(directory, file), extensions);
				files.push(...filesInDir);
			}
		});
		
		return files;
	},

	retrieveDirectories(directory: string) {
		const directories: string[] = [];
		fs.readdirSync(directory).forEach(async (file) => {
			const isDirectory = fs.lstatSync(path.join(directory, file)).isDirectory();
			if (isDirectory) directories.push(path.resolve(path.join(directory, file)));
	
			// Walk through subdirectories and add any directories found.
			if (fs.lstatSync(path.join(directory, file)).isDirectory()) {
				const dirs = this.retrieveDirectories(path.join(directory, file));
				directories.push(...dirs);
			}
		});

		return directories;
	},
	addedFullPathToLoadFunction(mainFile: string) {
		const fileContents = fs.readFileSync(mainFile, 'utf8');
		const lines = fileContents.split('\n');
		const modifiedLines = [];
		const commentText = '-- Loaded module path: ';

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const loadAssignmentMatch = line.match(/^\s*[\w\s]+\s*=\s*load\(['"](.+?)['"]\)/);
			if (loadAssignmentMatch) {
				const relativePath = loadAssignmentMatch[1];
				const absolutePath = path.resolve(path.dirname(mainFile), relativePath);

				const resourcePathMatch = absolutePath.match(/.*[\\\/](resources[\\\/].+)/);
				const truncatedPath = resourcePathMatch ? resourcePathMatch[1] : absolutePath;

				const previousLine = modifiedLines[modifiedLines.length - 1];
				const commentRegex = new RegExp(`^${commentText} ${truncatedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
				if (!commentRegex.test(previousLine)) {
					modifiedLines.push(`${commentText} ${truncatedPath}`);
				}
			}
			modifiedLines.push(line);
		}

		const modifiedFinalBuild = modifiedLines.join('\n');
		fs.writeFileSync(mainFile, modifiedFinalBuild, 'utf8');

		return modifiedFinalBuild;
	}
};