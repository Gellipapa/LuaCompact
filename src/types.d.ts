export type Command = {
	name: string;
	description: string;
	run(options: string[]): Promise<void> | void;
}

export type Commands = {
	[key: string]: Command;
}

export type LoadedFiles = {
	[key: string]: string;
}

export type LoadedDirectories = {
	[key: string]: string[];
}