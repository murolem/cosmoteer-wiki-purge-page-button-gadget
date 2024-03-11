import './styles.css'

$(() => {
    var logPrefix = 'purge-button';
    var className = 'purge-btn';

    // for how long to show the result of this action, in ms
    var actionResultDisplayDurationMs = 1000;

    // var l = (() => {
    //     var strings = {
    //         'label': {
    //             'en': 'Purge Cache'
    //         }
    //     } satisfies Record<string, Record<'en' & string, string>>;
    //     type Strings = typeof strings;
    //     type Lang = keyof Strings[keyof Strings];

    //     var lang: Lang = (() => {
    //         var result = mw.config.get('wgUserLanguage');
    //         return result in strings ? (result as Lang) : 'en';
    //     })();

    //     return (key: string) => {
    //         if (key in strings) {
    //             if (lang in strings[key as keyof Strings]) {
    //                 return strings[key as keyof Strings][lang];
    //             } else {
    //                 // no lang available, fallback to "en", which is always present
    //                 // by enforcing the type on "strings".
    //                 return strings[key as keyof Strings]['en'];
    //             }
    //         } else {
    //             // no key found
    //             console.error(`[l10n][${logPrefix}] translation not found for key: ${key}`);
    //             return '__UNKNOWN_KEY__';
    //         }
    //     }
    // })();

    function purgeCurrentPage() {
        var pageUrlWithoutParams = window.location.href.split('?')[0];
        var purgeUrl = `${pageUrlWithoutParams}?action=purge`;

        setPurgeButtonProgressState('in-progress');
        fetch(purgeUrl, {
            "method": "POST",
            // "credentials": "include"
        })
            .catch(err => {
                console.error(`[${logPrefix}] purge failed (request error)!`);
                console.log(err);
                setPurgeButtonProgressState('done--failure');
            })
            .then(res => {
                if (res && res.ok) {
                    console.log(`[${logPrefix}] purge successful!`);
                    setPurgeButtonProgressState('done--success');
                } else {
                    console.error(`[${logPrefix}] purge failed (no response/non-ok code)`);
                    console.log(res);
                    setPurgeButtonProgressState('done--failure');
                }
            })
    };

    type PurgeButtonProgressState =
        // inactive. either before it's clicked or after the purge is complete 
        // and the result display time has passed.
        'none'
        | 'in-progress'
        | 'done--success'
        | 'done--failure'
        ;

    var classByProgressState: Record<PurgeButtonProgressState, string> = {
        "none": `${className}--progress-state-none`,
        "in-progress": `${className}--progress-state-in-progress`,
        "done--success": `${className}--progress-state-success`,
        "done--failure": `${className}--progress-state-failure`,
    }


    var navbarMoreButton = $('#p-cactions');
    // a list containing all the buttons inside the "more" button menu
    var buttonList = navbarMoreButton.find('ul.vector-menu-content-list');

    var existingPurgeButtons = buttonList
        .children()
        .toArray()
        .filter(el => el.textContent?.toLocaleLowerCase().includes('purge cache'));

    if (existingPurgeButtons.length > 0) {
        console.log(`[${logPrefix}] found existing purge buttons (${existingPurgeButtons.length}), they will be removed: `, existingPurgeButtons);

        existingPurgeButtons.forEach(btn => btn.remove());
    }

    var purgeButton = $(`
    <li class="${className}--btn mw-list-item" style="
    ">
        <a title="Purge the page's cache. This will force all the page visitors to load the most recent version of the page.">
            <span>Purge Cache</span>
        </a>
    </li>
    `);
    purgeButton.find('a')[0].addEventListener('click', purgeCurrentPage);

    buttonList.append(purgeButton);



    var resultDisplayTimeoutHandle: number | undefined = undefined;
    var setPurgeButtonProgressState = (state: PurgeButtonProgressState) => {
        var setProgressStateClass = (stateToAdd: PurgeButtonProgressState) => {
            var classToAdd = classByProgressState[stateToAdd];
            var classesToRemove = Object.entries(classByProgressState)
                .filter(entry => entry[0] /* state */ !== stateToAdd)
                .map(entry => entry[1] /* class name */);

            purgeButton.addClass(classToAdd);
            purgeButton.removeClass(classesToRemove);
        }

        switch (state) {
            case 'none':
                clearTimeout(resultDisplayTimeoutHandle);
                setProgressStateClass('none');

                break;
            case 'in-progress':
                clearTimeout(resultDisplayTimeoutHandle);
                setProgressStateClass('in-progress');

                break;
            case 'done--success':
                clearTimeout(resultDisplayTimeoutHandle);
                setProgressStateClass('done--success');

                resultDisplayTimeoutHandle = window.setTimeout(() => setPurgeButtonProgressState('none'), actionResultDisplayDurationMs);

                break;
            case 'done--failure':
                setProgressStateClass('done--failure');

                resultDisplayTimeoutHandle = window.setTimeout(() => setPurgeButtonProgressState('none'), actionResultDisplayDurationMs);

                break;
            default:
                throw new Error(`[${logPrefix}]unsupported progress state: ` + state);
        }
    }

    function appendStylesheet(contents: string) {
        $(`<style>${contents}</style>`).appendTo('head');
    }

});