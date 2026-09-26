/**
 * Transient failures are worth retrying later; permanent ones aren't — retrying a bad key or an
 * empty balance just burns time. (Same split as ../Youtube Automation's image backends.)
 */
export class ImageGenerationError extends Error {
  constructor(
    message: string,
    readonly code: number | null,
    readonly transient: boolean,
  ) {
    super(message);
    this.name = "ImageGenerationError";
  }
}
