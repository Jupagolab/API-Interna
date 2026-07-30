import { execSync } from 'child_process';

export const backupOLT = async (req, res) => {
  const { oltIp, oltUser, oltPass, ftpIp, oltName } = req.body;

  // Nombre de archivo sencillo sin espacios ni caracteres especiales raros
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `backup_${oltName}_${dateStr}.config`;

  console.log(`[${new Date().toISOString()}] Iniciando backup OLT ${oltIp}...`);

  // Quitamos la "y" porque la MA5800 ejecuta directamente el backup
  const inputCommands = [
    'enable',
    'config',
    `backup configuration ftp ${ftpIp} ${fileName}`,
    'quit'
  ].join('\n') + '\n';

  const sshCmd = `sshpass -p '${oltPass}' ssh -tt -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${oltUser}@${oltIp}`;

  try {
    const stdout = execSync(sshCmd, {
      input: inputCommands,
      timeout: 60000
    }).toString();

    console.log(`[RESPUESTA OLT]:\n${stdout}`);

    return res.status(200).json({
      success: true,
      message: 'Comando de backup procesado con éxito por la OLT',
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