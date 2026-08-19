export enum ContactType {
	TWITTER = 'TWITTER',
	DISCORD = 'DISCORD',
	EMAIL = 'EMAIL'
}

export interface Contact {
	type: ContactType;
	info: string;
}

export interface User {
	name?: string;
	profilePic?: string;
	contact?: Contact;
	country?: string;
}

export interface SubmissionData {
	name?: string;
	message: string;
	photo: string;
}

export enum SubmissionStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	DENIED = 'DENIED'
}

export interface Submission {
	id: string;
	submittedAt: Date;
	updatedAt: Date;
	data: SubmissionData;
	status: SubmissionStatus;
}

export async function addSubmission(data: SubmissionData): Promise<string> {
	console.log(`Adding submission ${JSON.stringify(data)}`);
	console.log(data);
	return data.message;
}

export async function editSubmission(
	id: string,
	token: string,
	data: SubmissionData
): Promise<void> {
	console.log(`Editing submission ${id}:${token} to ${data}`);
}

export async function getSubmissions(): Promise<Submission[]> {
	return [
		{
			id: 'aaa',
			submittedAt: new Date(),
			updatedAt: new Date(),
			data: {
				message: 'My message',
				photo: 'abcde.png'
			},
			status: SubmissionStatus.PENDING
		},
		{
			id: 'bbb',
			submittedAt: new Date(),
			updatedAt: new Date(),
			data: {
				message: 'Other submission',
				photo: '22222.png'
			},
			status: SubmissionStatus.DENIED
		}
	];
}
