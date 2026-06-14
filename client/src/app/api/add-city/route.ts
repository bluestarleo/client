import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { city } = await req.json();
    if (!city || typeof city !== 'string' || city.trim() === '') {
      return NextResponse.json({ error: 'City name is required.' }, { status: 400 });
    }

    const trimmedCity = city.trim();

    // Resolve directories
    const workerDir = path.resolve(process.cwd(), '../worker');
    const agentScript = path.join(workerDir, 'agent.py');

    // Detect correct python command (Windows launcher 'py' vs standard 'python')
    let pythonCmd = 'python';
    if (process.platform === 'win32') {
      try {
        const { execSync } = require('child_process');
        execSync('py --version', { stdio: 'ignore' });
        pythonCmd = 'py';
      } catch (e) {
        pythonCmd = 'python';
      }
    }

    console.log(`[API] Starting agent.py using command "${pythonCmd}" for city: "${trimmedCity}"`);

    // Spawn Python process
    const pythonProcess = spawn(pythonCmd, [agentScript, trimmedCity], {
      cwd: workerDir,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
      },
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const exitCode = await new Promise<number>((resolve) => {
      pythonProcess.on('close', (code) => {
        resolve(code ?? 0);
      });
    });

    console.log(`[API] Agent process finished with exit code ${exitCode}`);

    if (exitCode !== 0) {
      console.error(`[API] Agent error. stderr: ${stderr}`);
      return NextResponse.json({
        error: `Failed to fetch points of interest for "${trimmedCity}".`,
        details: stderr || stdout || 'Unknown error during script execution.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added "${trimmedCity}" and populated points of interest.`,
      stdout: stdout
    });
  } catch (error: any) {
    console.error('[API Error]:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
