import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

/**
 * ImportExportService — Import from Postman/Insomnia/OpenAPI/WSDL,
 * and export to OpenAPI/Postman formats.
 * Delegates heavy lifting to @usebruno/cli or direct file transformation.
 */
export class ImportExportService {
  async importPostman(postmanJsonPath: string, targetCollectionPath: string): Promise<void> {
    await fs.mkdir(targetCollectionPath, { recursive: true });
    await execAsync(
      `bru convert --from postman --input "${postmanJsonPath}" --output "${targetCollectionPath}"`
    );
  }

  async importInsomnia(insomniaJsonPath: string, targetCollectionPath: string): Promise<void> {
    await fs.mkdir(targetCollectionPath, { recursive: true });
    await execAsync(
      `bru convert --from insomnia --input "${insomniaJsonPath}" --output "${targetCollectionPath}"`
    );
  }

  async importOpenApi(openapiPath: string, targetCollectionPath: string): Promise<void> {
    await fs.mkdir(targetCollectionPath, { recursive: true });
    await execAsync(
      `bru convert --from openapi --input "${openapiPath}" --output "${targetCollectionPath}"`
    );
  }

  async importWsdl(wsdlPath: string, targetCollectionPath: string): Promise<void> {
    await fs.mkdir(targetCollectionPath, { recursive: true });
    await execAsync(
      `bru convert --from wsdl --input "${wsdlPath}" --output "${targetCollectionPath}"`
    );
  }

  async exportOpenApi(collectionPath: string, outputPath: string, _version = "3.0"): Promise<void> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await execAsync(
      `bru export --format openapi --input "${collectionPath}" --output "${outputPath}"`
    );
  }

  async exportPostman(collectionPath: string, outputPath: string): Promise<void> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await execAsync(
      `bru export --format postman --input "${collectionPath}" --output "${outputPath}"`
    );
  }
}
