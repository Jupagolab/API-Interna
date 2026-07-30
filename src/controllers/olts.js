import { execSync } from 'child_process';

export const backupOLT = async (req, res) => {
  const { oltIp, oltUser, oltPass, ftpIp, fileName } = req.body;

  console.log(`[${new Date().toISOString()}] Iniciando backup OLT ${oltIp}...`);

  // Cadena de comandos limpia con saltos de línea puros
  const inputCommands = [
    'enable',
    'config',
    `backup configuration ftp ${ftpIp} ${fileName}`,
    'y',
    'quit'
  ].join('\n') + '\n';

  // Comando SSH limpio sin redirecciones ni 'echo'
  const sshCmd = `sshpass -p '${oltPass}' ssh -tt -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${oltUser}@${oltIp}`;

  try {
    // Inyectamos los comandos directamente por el STDIN del proceso
    const stdout = execSync(sshCmd, {
      input: inputCommands,
      timeout: 60000
    }).toString();

    console.log(`[RESPUESTA OLT]:\n${stdout}`);

    return res.status(200).json({
      success: true,
      message: 'Comando enviado exitosamente a la OLT',
      output: stdout
    });
  } catch (error) {
    console.error(`[ERROR]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error procesando comando en la OLT',
      error: error.message,
      stdout: error.stdout ? error.stdout.toString() : ''
    });
  }
}