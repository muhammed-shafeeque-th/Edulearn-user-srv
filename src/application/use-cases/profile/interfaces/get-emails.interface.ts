export abstract class IGetAllEmailsUseCase {
  abstract execute(): Promise<string[]>;
}
